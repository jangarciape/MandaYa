package pe.edu.pe.presentation

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFails

class MetricasAdministrativasTest {
    @Test
    fun usaLosTotalesDelEndpoint() {
        val response = """{"totales":{"encomiendas":4,"pagos":2,"ingresos":12.5,"traslados":1,"usuarios":8}}"""
        assertEquals(TotalesPanel(4, 2, 12.5, 1), leerTotalesPanel(response))
    }

    @Test
    fun rechazaRespuestaIncompleta() {
        assertFails { leerTotalesPanel("""{"totales":{"pagos":0}}""") }
    }
}
