package pe.edu.pe.presentation.movilidad

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import android.os.Looper
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalContext
import androidx.core.content.ContextCompat

@SuppressLint("MissingPermission")
@Composable
internal actual fun CapturaUbicacion(trasladoId: Int, enviar: (Double, Double) -> Unit) {
    val context = LocalContext.current
    val fine = Manifest.permission.ACCESS_FINE_LOCATION
    val coarse = Manifest.permission.ACCESS_COARSE_LOCATION
    fun granted(permission: String) =
        ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED

    var permitido by remember(trasladoId) { mutableStateOf(granted(fine) || granted(coarse)) }
    val permiso = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) {
        permitido = granted(fine) || granted(coarse)
    }
    LaunchedEffect(trasladoId) {
        if (!permitido) permiso.launch(arrayOf(fine, coarse))
    }
    val emitir by rememberUpdatedState(enviar)
    DisposableEffect(trasladoId, permitido) {
        val manager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        val listener = object : LocationListener {
            override fun onLocationChanged(location: Location) = emitir(location.latitude, location.longitude)
            override fun onProviderEnabled(provider: String) {}
            override fun onProviderDisabled(provider: String) {}
            @Deprecated("Legacy Android callback")
            override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
        }
        val provider = if (granted(fine) && manager.isProviderEnabled(LocationManager.GPS_PROVIDER))
            LocationManager.GPS_PROVIDER else LocationManager.NETWORK_PROVIDER
        if (permitido && provider in manager.allProviders) {
            try {
                manager.requestLocationUpdates(provider, 15000L, 0f, listener, Looper.getMainLooper())
            } catch (_: SecurityException) {
                permitido = false
            }
        }
        onDispose { manager.removeUpdates(listener) }
    }
}
