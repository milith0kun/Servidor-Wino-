import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Exportar asistencias a Excel
 */
export const exportarAsistencias = (datos, mes, anio) => {
  // Transformar datos
  const datosExcel = datos.map(item => ({
    'Fecha': format(new Date(item.fecha), 'dd/MM/yyyy', { locale: es }),
    'Usuario': item.usuario_nombre || `${item.nombre} ${item.apellido}`,
    'Cargo': item.cargo || '-',
    'Área': item.area || '-',
    'Entrada': item.hora_entrada || '-',
    'Salida': item.hora_salida || '-',
    'Horas Trabajadas': item.horas_trabajadas || '-',
    'Estado': item.estado || '-',
    'Método': item.metodo_fichado || '-',
    'GPS': item.latitud && item.longitud ? `${item.latitud}, ${item.longitud}` : '-',
  }));

  // Crear workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(datosExcel);

  // Ajustar anchos de columnas
  ws['!cols'] = [
    { wch: 12 }, // Fecha
    { wch: 25 }, // Usuario
    { wch: 20 }, // Cargo
    { wch: 15 }, // Área
    { wch: 10 }, // Entrada
    { wch: 10 }, // Salida
    { wch: 12 }, // Horas
    { wch: 12 }, // Estado
    { wch: 10 }, // Método
    { wch: 30 }, // GPS
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Asistencias');
  
  // Descargar
  const nombreArchivo = `asistencias_${anio}_${mes.toString().padStart(2, '0')}.xlsx`;
  XLSX.writeFile(wb, nombreArchivo);
};

/**
 * Exportar recepción de mercadería a Excel
 */
export const exportarRecepcionMercaderia = (datos, mes, anio, tipo) => {
  const datosExcel = datos.map(item => {
    const base = {
      'Fecha': format(new Date(item.fecha), 'dd/MM/yyyy', { locale: es }),
      'Hora': item.hora,
      'Proveedor': item.nombre_proveedor,
      'Producto': item.nombre_producto,
      'Cantidad': item.peso_unidad_recibido,
      'Unidad': item.unidad_medida,
      'Uniforme': item.uniforme_completo === 'C' ? 'Conforme' : 'No Conforme',
      'Transporte': item.transporte_adecuado === 'C' ? 'Conforme' : 'No Conforme',
      'Puntualidad': item.puntualidad === 'C' ? 'Conforme' : 'No Conforme',
      'Responsable Registro': item.responsable_registro_nombre,
      'Responsable Supervisión': item.responsable_supervision_nombre,
      'Observaciones': item.observaciones || '-',
      'Acciones Correctivas': item.accion_correctiva || '-',
      'Rechazado': item.producto_rechazado ? 'SÍ' : 'NO',
    };

    if (tipo === 'FRUTAS_VERDURAS') {
      base['Estado Producto'] = item.estado_producto;
      base['Integridad'] = item.conformidad_integridad_producto;
    } else if (tipo === 'ABARROTES') {
      base['Registro Sanitario'] = item.registro_sanitario_vigente ? 'SÍ' : 'NO';
      base['Fecha Vencimiento'] = item.fecha_vencimiento_producto ? format(new Date(item.fecha_vencimiento_producto), 'dd/MM/yyyy') : '-';
      base['Evaluación Vencimiento'] = item.evaluacion_vencimiento;
      base['Empaque'] = item.conformidad_empaque_primario;
    }

    return base;
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(datosExcel);

  // Ajustar anchos
  ws['!cols'] = Array(15).fill({ wch: 15 });

  XLSX.utils.book_append_sheet(wb, ws, tipo === 'FRUTAS_VERDURAS' ? 'Frutas/Verduras' : 'Abarrotes');
  
  const tipoNombre = tipo === 'FRUTAS_VERDURAS' ? 'frutas_verduras' : 'abarrotes';
  const nombreArchivo = `recepcion_${tipoNombre}_${anio}_${mes.toString().padStart(2, '0')}.xlsx`;
  XLSX.writeFile(wb, nombreArchivo);
};

/**
 * Exportar control de cocción a Excel
 */
export const exportarControlCoccion = (datos, mes, anio) => {
  const datosExcel = datos.map(item => ({
    'Fecha': format(new Date(item.fecha), 'dd/MM/yyyy', { locale: es }),
    'Hora': item.hora,
    'Producto': item.producto_cocinar,
    'Proceso': item.proceso_coccion === 'H' ? 'Horno' : item.proceso_coccion === 'P' ? 'Plancha' : 'Cocina',
    'Temperatura (°C)': item.temperatura_coccion,
    'Tiempo (min)': item.tiempo_coccion_minutos,
    'Conformidad': item.conformidad === 'C' ? 'Conforme' : 'No Conforme',
    'Acción Correctiva': item.accion_correctiva || '-',
    'Responsable': item.responsable_nombre,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(datosExcel);

  ws['!cols'] = [
    { wch: 12 },
    { wch: 10 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 30 },
    { wch: 25 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Control Cocción');
  
  const nombreArchivo = `control_coccion_${anio}_${mes.toString().padStart(2, '0')}.xlsx`;
  XLSX.writeFile(wb, nombreArchivo);
};

/**
 * Exportar lavado de frutas a Excel
 */
export const exportarLavadoFrutas = (datos, mes, anio) => {
  const datosExcel = datos.map(item => ({
    'Fecha': format(new Date(item.fecha), 'dd/MM/yyyy', { locale: es }),
    'Hora': item.hora,
    'Fruta/Verdura': item.nombre_fruta_verdura,
    'Producto Químico': item.producto_quimico,
    'Concentración': item.concentracion_producto,
    'Lavado Agua Potable': item.lavado_agua_potable === 'C' ? 'Conforme' : 'No Conforme',
    'Desinfección': item.desinfeccion_producto_quimico === 'C' ? 'Conforme' : 'No Conforme',
    'Concentración Correcta': item.concentracion_correcta === 'C' ? 'Conforme' : 'No Conforme',
    'Tiempo (min)': item.tiempo_desinfeccion_minutos,
    'Acciones Correctivas': item.acciones_correctivas || '-',
    'Supervisor': item.supervisor_nombre,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(datosExcel);

  ws['!cols'] = Array(11).fill({ wch: 18 });

  XLSX.utils.book_append_sheet(wb, ws, 'Lavado Frutas');
  
  const nombreArchivo = `lavado_frutas_${anio}_${mes.toString().padStart(2, '0')}.xlsx`;
  XLSX.writeFile(wb, nombreArchivo);
};

/**
 * Exportar lavado de manos a Excel
 */
export const exportarLavadoManos = (datos, mes, anio) => {
  const datosExcel = datos.map(item => ({
    'Fecha': format(new Date(item.fecha), 'dd/MM/yyyy', { locale: es }),
    'Hora': item.hora,
    'Empleado': item.empleado_nombre,
    'Área': item.area_estacion,
    'Turno': item.turno,
    'Firma': item.firma,
    'Procedimiento Correcto': item.procedimiento_correcto === 'Sí' ? 'SÍ' : 'NO',
    'Acción Correctiva': item.accion_correctiva || '-',
    'Supervisor': item.supervisor_nombre || '-',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(datosExcel);

  ws['!cols'] = [
    { wch: 12 },
    { wch: 10 },
    { wch: 25 },
    { wch: 12 },
    { wch: 12 },
    { wch: 20 },
    { wch: 20 },
    { wch: 30 },
    { wch: 25 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Lavado Manos');
  
  const nombreArchivo = `lavado_manos_${anio}_${mes.toString().padStart(2, '0')}.xlsx`;
  XLSX.writeFile(wb, nombreArchivo);
};

/**
 * Exportar temperatura de cámaras a Excel
 */
export const exportarTemperaturaCamaras = (datos, mes, anio) => {
  const datosExcel = datos.map(item => ({
    'Fecha': format(new Date(item.fecha), 'dd/MM/yyyy', { locale: es }),
    'Cámara': item.camara_nombre,
    'Temp Mañana (°C)': item.temperatura_manana,
    'Temp Tarde (°C)': item.temperatura_tarde,
    'Conformidad Mañana': item.conformidad_manana === 'C' ? 'Conforme' : 'No Conforme',
    'Conformidad Tarde': item.conformidad_tarde === 'C' ? 'Conforme' : 'No Conforme',
    'Acciones Correctivas': item.acciones_correctivas || '-',
    'Supervisor': item.supervisor_nombre || '-',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(datosExcel);

  ws['!cols'] = [
    { wch: 12 },
    { wch: 25 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 20 },
    { wch: 30 },
    { wch: 25 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Temperatura Cámaras');
  
  const nombreArchivo = `temperatura_camaras_${anio}_${mes.toString().padStart(2, '0')}.xlsx`;
  XLSX.writeFile(wb, nombreArchivo);
};

/**
 * Exportar resumen de no conformidades a Excel
 */
export const exportarResumenNC = (datos, mes, anio) => {
  const datosExcel = datos.map(item => ({
    'Tipo Control': item.tipo_control,
    'Total Registros': item.total_registros,
    'No Conformidades': item.no_conformidades,
    '% NC': `${item.porcentaje_nc.toFixed(2)}%`,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(datosExcel);

  ws['!cols'] = [
    { wch: 30 },
    { wch: 18 },
    { wch: 20 },
    { wch: 12 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Resumen NC');
  
  const nombreArchivo = `resumen_nc_${anio}_${mes.toString().padStart(2, '0')}.xlsx`;
  XLSX.writeFile(wb, nombreArchivo);
};
