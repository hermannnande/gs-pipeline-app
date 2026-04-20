import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../models/attendance.dart';
import '../models/delivery_list.dart';
import '../models/express_agence.dart';
import '../models/order.dart';
import '../models/rdv_stats.dart';
import '../models/stats.dart';
import '../models/user.dart';

/// Wrapper Dio centralise pour l'API GS Pipeline.
///
/// Pointe par defaut vers la prod (le meme backend que la web app).
/// Ne pas confondre avec l'URL du back-office obgestion.com :
/// l'API Express + Prisma vit sur gs-pipeline-app-2.vercel.app/api.
class ApiService {
  static const String defaultBaseUrl =
      'https://gs-pipeline-app-2.vercel.app/api';

  final Dio _dio;
  final FlutterSecureStorage _storage;
  String? _token;

  ApiService({String? baseUrl, FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage(),
        _dio = Dio(BaseOptions(
          baseUrl: baseUrl ?? defaultBaseUrl,
          connectTimeout: const Duration(seconds: 20),
          receiveTimeout: const Duration(seconds: 30),
          headers: {'Content-Type': 'application/json'},
        )) {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (opts, handler) async {
        _token ??= await _storage.read(key: 'jwt_token');
        if (_token != null && _token!.isNotEmpty) {
          opts.headers['Authorization'] = 'Bearer $_token';
        }
        handler.next(opts);
      },
      onError: (e, handler) async {
        if (e.response?.statusCode == 401) {
          await _storage.delete(key: 'jwt_token');
          _token = null;
        }
        handler.next(e);
      },
    ));
  }

  Future<String?> readStoredToken() async {
    _token = await _storage.read(key: 'jwt_token');
    return _token;
  }

  Future<void> _setToken(String? token) async {
    _token = token;
    if (token == null) {
      await _storage.delete(key: 'jwt_token');
    } else {
      await _storage.write(key: 'jwt_token', value: token);
    }
  }

  // ============== AUTH ==============

  Future<({String token, AppUser user})> login(
      String email, String password) async {
    final res = await _dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });
    final data = res.data as Map<String, dynamic>;
    final token = data['token'] as String;
    final user = AppUser.fromJson(data['user'] as Map<String, dynamic>);
    await _setToken(token);
    return (token: token, user: user);
  }

  Future<AppUser?> me() async {
    try {
      final res = await _dio.get('/auth/me');
      final data = res.data as Map<String, dynamic>;
      return AppUser.fromJson(data['user'] as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) return null;
      rethrow;
    }
  }

  Future<void> logout() async {
    await _setToken(null);
  }

  // ============== ORDERS ==============

  /// L'API filtre deja cote serveur pour APPELANT
  /// (NOUVELLE+A_APPELER + EXPEDITION + EXPRESS).
  Future<OrdersResponse> getOrders({
    int page = 1,
    int limit = 100,
    String? status,
    String? search,
  }) async {
    final res = await _dio.get('/orders', queryParameters: {
      'page': page,
      'limit': limit,
      if (status != null) 'status': status,
    });
    final body = OrdersResponse.fromJson(res.data as Map<String, dynamic>);
    if (search != null && search.trim().isNotEmpty) {
      final q = search.toLowerCase().trim();
      final filtered = body.orders.where((o) {
        return o.clientNom.toLowerCase().contains(q) ||
            o.clientTelephone.toLowerCase().contains(q) ||
            o.produitNom.toLowerCase().contains(q) ||
            o.clientVille.toLowerCase().contains(q) ||
            o.orderReference.toLowerCase().contains(q);
      }).toList();
      return OrdersResponse(
        orders: filtered,
        total: filtered.length,
        page: body.page,
        totalPages: body.totalPages,
      );
    }
    return body;
  }

  /// Commandes deja traitees par le caller authentifie (callerId = me).
  Future<List<OrderItem>> getMyProcessed({
    String? status,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    final res = await _dio.get('/orders', queryParameters: {
      'page': 1,
      'limit': 500,
      if (status != null && status != 'ALL') 'status': status,
      if (startDate != null) 'startDate': startDate.toIso8601String(),
      if (endDate != null) 'endDate': endDate.toIso8601String(),
    });
    final body = OrdersResponse.fromJson(res.data as Map<String, dynamic>);
    return body.orders.where((o) => o.callerId != null).toList();
  }

  Future<void> updateOrderStatus(int id, String status,
      {String? note}) async {
    await _dio.put('/orders/$id/status', data: {
      'status': status,
      if (note != null && note.isNotEmpty) 'note': note,
    });
  }

  Future<void> markCallAttempt(int id) async {
    await _dio.post('/orders/$id/marquer-appel');
  }

  /// Marque une commande "EN ATTENTE PAIEMENT" (futur EXPEDITION).
  Future<void> marquerAttentePaiement(int id, {String? note}) async {
    await _dio.post('/orders/$id/attente-paiement', data: {
      if (note != null && note.isNotEmpty) 'note': note,
    });
  }

  /// EXPEDITION : client paie 100% maintenant.
  Future<void> createExpedition(
    int orderId, {
    required double montantPaye,
    required String modePaiement,
    String? referencePayment,
    String? note,
  }) async {
    await _dio.post('/orders/$orderId/expedition', data: {
      'montantPaye': montantPaye,
      'modePaiement': modePaiement,
      if (referencePayment != null) 'referencePayment': referencePayment,
      if (note != null && note.isNotEmpty) 'note': note,
    });
  }

  /// EXPRESS : client paie 10% (acompte), retire en agence et paye le reste.
  Future<void> createExpress(
    int orderId, {
    required double montantPaye,
    required String modePaiement,
    required String agenceRetrait,
    String? referencePayment,
    String? note,
  }) async {
    await _dio.post('/orders/$orderId/express', data: {
      'montantPaye': montantPaye,
      'modePaiement': modePaiement,
      'agenceRetrait': agenceRetrait,
      if (referencePayment != null) 'referencePayment': referencePayment,
      if (note != null && note.isNotEmpty) 'note': note,
    });
  }

  // ============== RDV ==============

  Future<({List<OrderItem> orders, RdvStats stats})> getRdv({
    String? rappele,
    String? search,
  }) async {
    final res = await _dio.get('/rdv', queryParameters: {
      if (rappele != null) 'rappele': rappele,
      if (search != null && search.isNotEmpty) 'search': search,
    });
    final data = res.data as Map<String, dynamic>;
    final list = (data['orders'] as List? ?? [])
        .map((e) => OrderItem.fromJson(e as Map<String, dynamic>))
        .toList();
    final stats = data['stats'] != null
        ? RdvStats.fromJson(data['stats'] as Map<String, dynamic>)
        : RdvStats.empty();
    return (orders: list, stats: stats);
  }

  Future<void> programmerRdv(int id, DateTime rdvDate, {String? note}) async {
    await _dio.post('/rdv/$id/programmer', data: {
      'rdvDate': rdvDate.toIso8601String(),
      if (note != null && note.isNotEmpty) 'rdvNote': note,
    });
  }

  Future<void> rappelerRdv(int id, {String? note}) async {
    await _dio.post('/rdv/$id/rappeler', data: {
      if (note != null && note.isNotEmpty) 'note': note,
    });
  }

  Future<void> updateRdv(int id, DateTime rdvDate, {String? note}) async {
    await _dio.put('/rdv/$id', data: {
      'rdvDate': rdvDate.toIso8601String(),
      if (note != null && note.isNotEmpty) 'rdvNote': note,
    });
  }

  Future<void> annulerRdv(int id) async {
    await _dio.delete('/rdv/$id');
  }

  // ============== ATTENDANCE ==============

  Future<AttendanceToday> getTodayAttendance() async {
    final res = await _dio.get('/attendance/my-attendance-today');
    final body = res.data as Map<String, dynamic>;
    final att = body['attendance'];
    return AttendanceToday.fromJson(att as Map<String, dynamic>?);
  }

  Future<({bool ok, String message, AttendanceToday attendance})> markArrival(
      double latitude, double longitude) async {
    try {
      final res = await _dio.post('/attendance/mark-arrival', data: {
        'latitude': latitude,
        'longitude': longitude,
      });
      final body = res.data as Map<String, dynamic>;
      return (
        ok: true,
        message: (body['message'] ?? 'Pointage enregistre') as String,
        attendance: AttendanceToday.fromJson(
            body['attendance'] as Map<String, dynamic>?),
      );
    } on DioException catch (e) {
      final msg = (e.response?.data is Map<String, dynamic>)
          ? ((e.response!.data as Map<String, dynamic>)['message'] ??
              (e.response!.data as Map<String, dynamic>)['error'] ??
              'Erreur lors du pointage')
          : 'Erreur lors du pointage';
      return (ok: false, message: msg.toString(), attendance: AttendanceToday());
    }
  }

  Future<({bool ok, String message, AttendanceToday attendance})> markDeparture(
      double latitude, double longitude) async {
    try {
      final res = await _dio.post('/attendance/mark-departure', data: {
        'latitude': latitude,
        'longitude': longitude,
      });
      final body = res.data as Map<String, dynamic>;
      return (
        ok: true,
        message: (body['message'] ?? 'Depart enregistre') as String,
        attendance: AttendanceToday.fromJson(
            body['attendance'] as Map<String, dynamic>?),
      );
    } on DioException catch (e) {
      final msg = (e.response?.data is Map<String, dynamic>)
          ? ((e.response!.data as Map<String, dynamic>)['message'] ??
              (e.response!.data as Map<String, dynamic>)['error'] ??
              'Erreur lors du depart')
          : 'Erreur lors du depart';
      return (ok: false, message: msg.toString(), attendance: AttendanceToday());
    }
  }

  // ============== STATS ==============

  Future<CallerStats> getMyStats(String period) async {
    final res = await _dio.get('/stats/my-stats',
        queryParameters: {'period': period});
    return CallerStats.fromJson(res.data as Map<String, dynamic>);
  }

  // ============== TOUTES LES COMMANDES (admin/Orders.tsx) ==============

  /// Liste brute toutes commandes, avec filtres optionnels.
  /// L'appelant a le droit de lire (backend filtre deja cote role).
  Future<OrdersResponse> getAllOrders({
    int page = 1,
    int limit = 20,
    String? status,
    String? produit,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    final res = await _dio.get('/orders', queryParameters: {
      'page': page,
      'limit': limit,
      if (status != null && status.isNotEmpty) 'status': status,
      if (produit != null && produit.isNotEmpty) 'produit': produit,
      if (startDate != null) 'startDate': startDate.toIso8601String(),
      if (endDate != null) 'endDate': endDate.toIso8601String(),
    });
    return OrdersResponse.fromJson(res.data as Map<String, dynamic>);
  }

  /// Liste des noms de produits (pour remplir le filtre produit).
  Future<List<String>> getProductNames() async {
    try {
      final res = await _dio.get('/products');
      final body = res.data as Map<String, dynamic>;
      final list = (body['products'] as List? ?? [])
          .map((e) => (e as Map<String, dynamic>)['nom']?.toString() ?? '')
          .where((s) => s.isNotEmpty)
          .toList();
      return list;
    } catch (_) {
      return <String>[];
    }
  }

  // ============== EXPEDITIONS & EXPRESS (admin/ExpeditionsExpress.tsx) ==============

  /// Recupere les commandes a un statut donne. Utilise pour alimenter les
  /// differents onglets (EXPEDITION, EXPRESS, EXPRESS_ENVOYE, EXPRESS_ARRIVE,
  /// EXPRESS_LIVRE, ASSIGNEE+EXPEDITION...)
  Future<List<OrderItem>> getOrdersByStatus(
    String status, {
    int limit = 100,
    String? deliveryType,
  }) async {
    final res = await _dio.get('/orders', queryParameters: {
      'status': status,
      'limit': limit,
      'page': 1,
      if (deliveryType != null) 'deliveryType': deliveryType,
    });
    final body = OrdersResponse.fromJson(res.data as Map<String, dynamic>);
    return body.orders;
  }

  // ============== EXPRESS EN AGENCE (gestionnaire/ExpressAgence.tsx) ==============

  Future<({List<ExpressAgenceItem> orders, ExpressAgenceStats stats})>
      getExpressEnAgence({
    String? search,
    String? agence,
    String? statut,
    bool nonRetires = false,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    final res = await _dio.get('/express/en-agence', queryParameters: {
      if (search != null && search.isNotEmpty) 'search': search,
      if (agence != null && agence.isNotEmpty) 'agence': agence,
      if (statut != null && statut.isNotEmpty) 'statut': statut,
      'nonRetires': nonRetires ? 'true' : 'false',
      if (startDate != null)
        'startDate': startDate.toIso8601String().split('T').first,
      if (endDate != null)
        'endDate': endDate.toIso8601String().split('T').first,
    });
    final body = res.data as Map<String, dynamic>;
    final list = (body['orders'] as List? ?? [])
        .map((e) => ExpressAgenceItem.fromJson(e as Map<String, dynamic>))
        .toList();
    final stats = body['stats'] != null
        ? ExpressAgenceStats.fromJson(body['stats'] as Map<String, dynamic>)
        : ExpressAgenceStats.empty();
    return (orders: list, stats: stats);
  }

  /// Notifie le client qu'un colis EXPRESS l'attend en agence.
  Future<void> notifierExpressClient(int id, {String? note}) async {
    await _dio.post('/express/$id/notifier', data: {
      if (note != null && note.isNotEmpty) 'note': note,
    });
  }

  /// Confirme le retrait du colis par le client.
  Future<void> confirmerRetraitExpress(int id) async {
    await _dio.post('/express/$id/confirmer-retrait');
  }

  // ============== LISTES DE LIVRAISON (gestionnaire/Deliveries.tsx) ==============

  Future<List<DeliveryList>> getDeliveryLists() async {
    final res = await _dio.get('/delivery/lists');
    final body = res.data as Map<String, dynamic>;
    final list = (body['lists'] as List? ?? [])
        .map((e) => DeliveryList.fromJson(e as Map<String, dynamic>))
        .toList();
    return list;
  }
}
