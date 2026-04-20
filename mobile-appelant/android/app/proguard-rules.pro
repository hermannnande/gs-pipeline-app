# =============================================================================
# Regles ProGuard / R8 pour l'app appelant
# =============================================================================
# R8 est tres agressif et peut casser des libs natives qui utilisent la
# reflection (Flutter, dio, flutter_local_notifications, ...).
# On garde explicitement les classes critiques.
# =============================================================================

# --- Flutter / Dart embedding ---
-keep class io.flutter.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.plugins.** { *; }
-keep class io.flutter.embedding.** { *; }
-dontwarn io.flutter.embedding.**

# --- flutter_local_notifications ---
-keep class com.dexterous.** { *; }
-keep class com.dexterous.flutterlocalnotifications.models.** { *; }
-keep class com.dexterous.flutterlocalnotifications.models.styles.** { *; }
-keep class com.google.gson.reflect.TypeToken { *; }
-keep class * extends com.google.gson.reflect.TypeToken
-keep public class * implements java.lang.reflect.Type
-keepattributes Signature, *Annotation*, EnclosingMethod, InnerClasses

# --- Gson (utilise par flutter_local_notifications en interne) ---
-keep class com.google.gson.** { *; }

# --- geolocator (services Google Play / location) ---
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# --- WorkManager (utilise par notifications planifiees) ---
-keep class androidx.work.** { *; }

# --- Multidex ---
-keep class androidx.multidex.** { *; }

# --- Annotations Kotlin ---
-keep class kotlin.Metadata { *; }
-keep class kotlin.reflect.** { *; }
-keepclassmembers class kotlin.Metadata {
    public <methods>;
}

# --- Conserve les noms de classes pour les stack traces lisibles ---
-keepattributes SourceFile,LineNumberTable
