package pe.edu.pe.presentation

import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.*
import io.ktor.client.HttpClient
import io.ktor.client.request.bearerAuth
import io.ktor.client.request.get
import io.ktor.client.statement.bodyAsText
import io.ktor.http.isSuccess
import kotlinx.coroutines.CancellationException
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import org.koin.compose.koinInject
import pe.edu.pe.Datas.local.SessionManager
import pe.edu.pe.Datas.remote.api.ApiClient

@Serializable
internal data class TotalesPanel(val encomiendas: Int, val pagos: Int, val ingresos: Double, val traslados: Int)

@Serializable
private data class RespuestaPanel(val totales: TotalesPanel)

internal fun leerTotalesPanel(body: String): TotalesPanel =
    Json { ignoreUnknownKeys = true }.decodeFromString<RespuestaPanel>(body).totales

@Composable
internal fun MetricasAdministrativas() {
    val client = koinInject<HttpClient>()
    val session = koinInject<SessionManager>()
    var intento by remember { mutableIntStateOf(0) }
    var totales by remember { mutableStateOf<TotalesPanel?>(null) }
    var error by remember { mutableStateOf(false) }
    LaunchedEffect(intento) {
        error = false
        try {
            val token = session.getToken()?.removePrefix("Bearer ")?.trim()
            require(!token.isNullOrEmpty())
            val respuesta = client.get(ApiClient.getBaseUrl() + "/reportes/estadisticas") { bearerAuth(token) }
            check(respuesta.status.isSuccess())
            totales = leerTotalesPanel(respuesta.bodyAsText())
        } catch (cancel: CancellationException) {
            throw cancel
        } catch (_: Exception) {
            error = true
        }
    }
    val datos = totales
    when {
        error -> {
            Text("No se pudieron cargar las métricas.")
            TextButton(onClick = { intento++ }) { Text("Reintentar") }
        }
        datos == null -> Text("Cargando métricas…")
        else -> {
            Text("Encomiendas: ${datos.encomiendas} · Traslados: ${datos.traslados}")
            Text("Pagos: ${datos.pagos} · Ingresos: S/ ${datos.ingresos}")
        }
    }
}
