package pe.edu.pe

import kotlinx.coroutines.runBlocking
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue
import pe.edu.pe.presentation.viewmodel.enviarGpsSiActivo

class EnvioGpsTest {
    @Test fun reanudaEnLaSiguienteLecturaYDejaDeEnviarAlFinalizar() = runBlocking {
        var llamadas = 0
        val enviar: suspend (Int, Double, Double) -> Result<Unit> = { _, _, _ ->
            llamadas++
            if (llamadas == 1) Result.failure(java.io.IOException("Red interrumpida")) else Result.success(Unit)
        }
        assertTrue(enviarGpsSiActivo("EN_CURSO", 3, -12.0, -77.0, enviar).isFailure)
        assertTrue(enviarGpsSiActivo("EN_CURSO", 3, -12.1, -77.0, enviar).isSuccess)
        enviarGpsSiActivo("FINALIZADO", 3, -12.2, -77.0, enviar)
        assertEquals(2, llamadas)
    }
}
