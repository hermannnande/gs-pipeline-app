import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/user.dart';
import '../services/api_service.dart';

final apiServiceProvider = Provider<ApiService>((ref) => ApiService());

class AuthState {
  final AppUser? user;
  final bool loading;
  final String? error;

  const AuthState({this.user, this.loading = false, this.error});

  bool get isLoggedIn => user != null;

  AuthState copyWith({AppUser? user, bool? loading, String? error}) =>
      AuthState(
        user: user ?? this.user,
        loading: loading ?? this.loading,
        error: error,
      );
}

class AuthNotifier extends Notifier<AuthState> {
  late final ApiService _api;

  @override
  AuthState build() {
    _api = ref.read(apiServiceProvider);
    _bootstrap();
    return const AuthState(loading: true);
  }

  Future<void> _bootstrap() async {
    final token = await _api.readStoredToken();
    if (token == null || token.isEmpty) {
      state = const AuthState();
      return;
    }
    try {
      final user = await _api.me();
      state = AuthState(user: user);
    } catch (_) {
      await _api.logout();
      state = const AuthState();
    }
  }

  Future<({bool ok, String? error})> login(
      String email, String password) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final res = await _api.login(email.trim(), password);
      if (res.user.role != 'APPELANT') {
        await _api.logout();
        const msg =
            'Cette application est reservee aux appelants. Votre role : ';
        state = AuthState(error: '$msg${res.user.role}.');
        return (ok: false, error: state.error);
      }
      state = AuthState(user: res.user);
      return (ok: true, error: null);
    } catch (e) {
      final msg = _extractDioMessage(e) ?? 'Identifiants invalides';
      state = AuthState(error: msg);
      return (ok: false, error: msg);
    }
  }

  Future<void> logout() async {
    await _api.logout();
    state = const AuthState();
  }

  String? _extractDioMessage(Object e) {
    final s = e.toString();
    if (s.contains('401')) return 'Email ou mot de passe incorrect';
    if (s.contains('SocketException') || s.contains('Network')) {
      return 'Probleme de connexion. Verifiez votre internet.';
    }
    return null;
  }
}

final authProvider =
    NotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);
