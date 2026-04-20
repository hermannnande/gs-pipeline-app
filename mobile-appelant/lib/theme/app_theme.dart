import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Palette reprise du tailwind.config.js de la web app pour preserver
/// l'identite visuelle exacte de la console appelant.
class AppColors {
  // primary : sky/cyan (Tailwind primary)
  static const primary50 = Color(0xFFF0F9FF);
  static const primary100 = Color(0xFFE0F2FE);
  static const primary500 = Color(0xFF0EA5E9);
  static const primary600 = Color(0xFF0284C7);
  static const primary700 = Color(0xFF0369A1);

  // success
  static const success50 = Color(0xFFF0FDF4);
  static const success100 = Color(0xFFDCFCE7);
  static const success500 = Color(0xFF22C55E);
  static const success600 = Color(0xFF16A34A);
  static const success700 = Color(0xFF15803D);

  // warning
  static const warning50 = Color(0xFFFFFBEB);
  static const warning100 = Color(0xFFFEF3C7);
  static const warning500 = Color(0xFFF59E0B);
  static const warning600 = Color(0xFFD97706);

  // danger
  static const danger50 = Color(0xFFFEF2F2);
  static const danger100 = Color(0xFFFEE2E2);
  static const danger500 = Color(0xFFEF4444);
  static const danger600 = Color(0xFFDC2626);

  // accent
  static const accent500 = Color(0xFFD946EF);

  // neutres
  static const gray50 = Color(0xFFF9FAFB);
  static const gray100 = Color(0xFFF3F4F6);
  static const gray200 = Color(0xFFE5E7EB);
  static const gray400 = Color(0xFF9CA3AF);
  static const gray500 = Color(0xFF6B7280);
  static const gray700 = Color(0xFF374151);
  static const gray800 = Color(0xFF1F2937);
  static const gray900 = Color(0xFF111827);

  // statuts commande (reprend statusHelpers.ts)
  static const statusBgNouvelle = Color(0xFFDBEAFE);
  static const statusFgNouvelle = Color(0xFF1E40AF);
  static const statusBgAAppeler = Color(0xFFFEF3C7);
  static const statusFgAAppeler = Color(0xFF92400E);
  static const statusBgValidee = Color(0xFFDCFCE7);
  static const statusFgValidee = Color(0xFF166534);
  static const statusBgAnnulee = Color(0xFFFEE2E2);
  static const statusFgAnnulee = Color(0xFF991B1B);
  static const statusBgInjoignable = Color(0xFFFFEDD5);
  static const statusFgInjoignable = Color(0xFF9A3412);
  static const statusBgAssignee = Color(0xFFEDE9FE);
  static const statusFgAssignee = Color(0xFF5B21B6);
  static const statusBgLivree = Color(0xFFD1FAE5);
  static const statusFgLivree = Color(0xFF065F46);
  static const statusBgExpedition = Color(0xFFCFFAFE);
  static const statusFgExpedition = Color(0xFF155E75);
  static const statusBgExpress = Color(0xFFFEF3C7);
  static const statusFgExpress = Color(0xFF92400E);
}

class AppTheme {
  static ThemeData light() {
    final base = ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary500,
        primary: AppColors.primary600,
        secondary: AppColors.accent500,
        error: AppColors.danger500,
        surface: Colors.white,
      ),
      scaffoldBackgroundColor: AppColors.gray50,
    );

    final textTheme = GoogleFonts.interTextTheme(base.textTheme).copyWith(
      displayLarge: GoogleFonts.poppins(
          fontWeight: FontWeight.w700, color: AppColors.gray900),
      displayMedium: GoogleFonts.poppins(
          fontWeight: FontWeight.w700, color: AppColors.gray900),
      displaySmall: GoogleFonts.poppins(
          fontWeight: FontWeight.w600, color: AppColors.gray900),
      headlineMedium: GoogleFonts.poppins(
          fontWeight: FontWeight.w600, color: AppColors.gray900),
      headlineSmall: GoogleFonts.poppins(
          fontWeight: FontWeight.w600, color: AppColors.gray900),
      titleLarge: GoogleFonts.poppins(
          fontWeight: FontWeight.w600, color: AppColors.gray900),
    );

    return base.copyWith(
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 1,
        surfaceTintColor: Colors.transparent,
        iconTheme: const IconThemeData(color: AppColors.gray700),
        titleTextStyle: GoogleFonts.poppins(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: AppColors.gray900,
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: Colors.white,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.gray200),
        ),
        margin: EdgeInsets.zero,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.gray200),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.gray200),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary500, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.danger500),
        ),
        labelStyle: const TextStyle(color: AppColors.gray500),
        hintStyle: const TextStyle(color: AppColors.gray400),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary600,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: GoogleFonts.inter(
              fontWeight: FontWeight.w600, fontSize: 15),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.gray700,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          side: const BorderSide(color: AppColors.gray200),
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12)),
          textStyle: GoogleFonts.inter(
              fontWeight: FontWeight.w600, fontSize: 15),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primary600,
          textStyle: GoogleFonts.inter(fontWeight: FontWeight.w600),
        ),
      ),
      dividerTheme: const DividerThemeData(color: AppColors.gray200, space: 1),
      navigationDrawerTheme: NavigationDrawerThemeData(
        backgroundColor: Colors.white,
        elevation: 0,
        indicatorColor: AppColors.primary600,
        indicatorShape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const IconThemeData(color: Colors.white);
          }
          return const IconThemeData(color: AppColors.gray700);
        }),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return GoogleFonts.inter(
                color: Colors.white, fontWeight: FontWeight.w600);
          }
          return GoogleFonts.inter(
              color: AppColors.gray700, fontWeight: FontWeight.w500);
        }),
      ),
    );
  }
}
