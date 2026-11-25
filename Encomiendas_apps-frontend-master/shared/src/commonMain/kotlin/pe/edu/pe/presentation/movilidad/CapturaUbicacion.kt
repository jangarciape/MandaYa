package pe.edu.pe.presentation.movilidad

import androidx.compose.runtime.Composable

@Composable
internal expect fun CapturaUbicacion(trasladoId: Int, enviar: (Double, Double) -> Unit)
