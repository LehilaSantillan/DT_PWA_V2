/* ================================================= */
/* 1. Variables Globales y DOM           */
/* ================================================= */

const $ = (selector) => document.querySelector(selector);

// Elementos del Dashboard
const gastoList = $('#gasto-list');
const ingresoList = $('#ingreso-list');
const filterSelect = $('#filter-mes');

// Elementos del Modal de Nueva Transacción
const newExpenseModal = $('#newExpenseModal');
const btnNuevoGasto = $('#btnNuevoGasto');
const closeButtons = document.querySelectorAll('.close-button, .cancel-button'); // Botones de cierre/cancelar
const expenseForm = $('.expense-form');

// Elementos del Modal de Detalles
const detailsModal = $('#detailsModal');


/* ================================================= */
/* 2. Funciones de Ayuda y Formato       */
/* ================================================= */

/**
 * Busca una transacción por su ID.
 * @param {number|string} id - El ID de la transacción.
 * @param {Array} transacciones - Lista de todas las transacciones.
 * @returns {object|undefined} La transacción encontrada.
 */
function encontrarTransaccionPorId(id, transacciones) {
    const numericId = parseInt(id, 10);
    return transacciones.find(trx => trx.id === numericId);
}

/**
/**
 * Formatea un número como moneda, eliminando el prefijo "US" no deseado.
 * @param {number} amount
 * @returns {string} Monto formateado (ej: $1,200.00).
 */
function formatCurrency(amount) {
    let formatted = amount.toLocaleString('es-ES', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 2
    });
    
    // 1. Reemplaza "US$" o "USD" con solo el símbolo "$".
    // La expresión regular /US\$/g busca el patrón "US$" globalmente.
    // .replace(/USD/g, '$') maneja el caso de "USD" sin el símbolo pegado.
    // .trim() elimina cualquier espacio extra que pueda quedar.
    return formatted.replace(/US\$/g, '$').replace(/USD/g, '$').trim();
}

/* ================================================= */
/* 3. Funciones de Renderizado           */
/* ================================================= */

/**
 * Genera el HTML para un elemento de transacción.
 * (Corregido el problema de anidación que causaba errores en el click)
 * @param {object} transaccion - Objeto de la transacción.
 * @returns {string} HTML del item de la lista.
 */
function crearElementoTransaccion(transaccion) {
    const isGasto = transaccion.tipo === 'gasto';
    const amountClass = isGasto ? 't-amount gasto' : 't-amount ingreso';
    const amountSign = isGasto ? '-' : '+';
    const amountColor = isGasto ? '#ff4757' : '#34d399';
    
    // Formateo de fecha
    const dateOptions = { day: '2-digit', month: 'short' };
    let formattedDate = new Date(transaccion.fecha).toLocaleDateString('es-ES', dateOptions);
    
    const formattedAmount = `${amountSign}${formatCurrency(transaccion.monto)}`;
    const transactionId = transaccion.id || 'temp'; 
    const iconClass = isGasto ? 'fa-solid fa-arrow-up-right-from-square' : 'fa-solid fa-arrow-down-left-and-up'; // Ícono representativo

    return `
        <div class="transaction-item view-details" data-id="${transactionId}"> 
            <div class="t-details">
                <i class="fas fa-money-bill-transfer t-icon"></i>
                <div class="t-info">
                    <h4>${transaccion.categoria}</h4>
                    <span>${transaccion.descripcion || 'Sin descripción'} - ${formattedDate}</span>
                </div>
            </div>
            <div class="${amountClass}" style="color: ${amountColor};">
                ${formattedAmount}
            </div>
            <div class="t-actions">
                <i class="fas fa-trash-alt delete-button" data-id="${transactionId}"></i>
            </div>
        </div>
    `;
}

/**
 * Renderiza la lista completa de gastos e ingresos filtrados.
 * @param {Array} transacciones - Lista filtrada de transacciones.
 */
function renderizarListas(transacciones) {
    const gastos = transacciones.filter(t => t.tipo === 'gasto');
    const ingresos = transacciones.filter(t => t.tipo === 'ingreso');

    gastoList.innerHTML = gastos.length > 0
        ? gastos.map(crearElementoTransaccion).join('')
        : '<p class="empty-list-message">No hay gastos registrados.</p>';

    ingresoList.innerHTML = ingresos.length > 0
        ? ingresos.map(crearElementoTransaccion).join('')
        : '<p class="empty-list-message">No hay ingresos registrados.</p>';
}

/**
 * Renderiza las métricas (Totales, Promedio, Conteo).
 * @param {Array} transacciones - Lista filtrada de transacciones.
 */
function renderizarMetricas(transacciones) {
    const gastos = transacciones.filter(t => t.tipo === 'gasto');
    const ingresos = transacciones.filter(t => t.tipo === 'ingreso');

    // --- Métricas de Gasto ---
    const gastoTotal = gastos.reduce((sum, t) => sum + t.monto, 0);
    const gastoNumero = gastos.length;
    const gastoPromedio = gastoNumero > 0 ? gastoTotal / gastoNumero : 0;
    const gastoCategorias = new Set(gastos.map(t => t.categoria)).size;

    $('#gastoTotalValue').textContent = formatCurrency(gastoTotal);
    $('#gastoNumeroValue').textContent = gastoNumero;
    $('#gastoPromedioValue').textContent = formatCurrency(gastoPromedio);
    $('#gastoCategoriasValue').textContent = gastoCategorias;

    // --- Métricas de Ingreso ---
    const ingresoTotal = ingresos.reduce((sum, t) => sum + t.monto, 0);
    const ingresoNumero = ingresos.length;
    const ingresoPromedio = ingresoNumero > 0 ? ingresoTotal / ingresoNumero : 0;
    const ingresoCategorias = new Set(ingresos.map(t => t.categoria)).size; // Aquí 'Categorías' son Fuentes

    $('#ingresoTotalValue').textContent = formatCurrency(ingresoTotal);
    $('#ingresoNumeroValue').textContent = ingresoNumero;
    $('#ingresoPromedioValue').textContent = formatCurrency(ingresoPromedio);
    $('#ingresoCategoriasValue').textContent = ingresoCategorias;
}

/**
 * Renderiza todos los elementos del dashboard.
 * @param {Array} transacciones - Transacciones a renderizar.
 */
function actualizarDashboard(transacciones) {
    // Ordenar por fecha (más reciente primero)
    const transaccionesOrdenadas = transacciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    renderizarMetricas(transaccionesOrdenadas);
    renderizarListas(transaccionesOrdenadas);
}


/* ================================================= */
/* 4. Funciones de Filtrado              */
/* ================================================= */

/**
 * Obtiene el rango de fechas para el filtro seleccionado.
 * @param {string} filtro - El valor del filtro (todo, esta-semana, este-mes, este-anio).
 * @returns {{start: Date|null, end: Date|null}} Rango de fechas.
 */
function obtenerRangoFechas(filtro) {
    const now = new Date();
    let start = null;
    let end = new Date();
    end.setHours(23, 59, 59, 999); // Final del día

    switch (filtro) {
        case 'esta-semana':
            start = new Date(now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))); // Lunes de esta semana
            start.setHours(0, 0, 0, 0);
            break;
        case 'este-mes':
            start = new Date(now.getFullYear(), now.getMonth(), 1); // Primer día del mes
            start.setHours(0, 0, 0, 0);
            break;
        case 'este-anio':
            start = new Date(now.getFullYear(), 0, 1); // Primer día del año
            start.setHours(0, 0, 0, 0);
            break;
        case 'todo':
        default:
            return { start: null, end: null };
    }
    return { start, end };
}

/**
 * Aplica el filtro seleccionado y recarga el dashboard.
 */
async function aplicarFiltro() {
    const filtro = filterSelect.value;
    const { start, end } = obtenerRangoFechas(filtro);

    try {
        const todasTransacciones = await window.obtenerTodasLasTransacciones();
        
        const transaccionesFiltradas = todasTransacciones.filter(t => {
            if (!start) return true; // Si es 'todo'
            
            const fechaTrx = new Date(t.fecha);
            fechaTrx.setHours(0, 0, 0, 0); // Normalizar a medianoche para comparación

            // La fecha debe ser mayor o igual al inicio Y menor o igual al final.
            return fechaTrx >= start && fechaTrx <= end;
        });

        actualizarDashboard(transaccionesFiltradas);
    } catch (error) {
        console.error("Error al aplicar filtro:", error);
    }
}


/* ================================================= */
/* 5. Funciones del Modal Detalles       */
/* ================================================= */

/**
 * Muestra el modal de detalles con los datos de una transacción.
 * @param {string} id - ID de la transacción.
 */
async function mostrarDetallesTransaccion(id) {
    try {
        const transacciones = await window.obtenerTodasLasTransacciones(); 
        const trx = encontrarTransaccionPorId(id, transacciones);

        if (trx) {
            // Rellenar el modal con datos
            $('#detail-tipo').textContent = trx.tipo;
            
            // Monto y color (para la mejora visual)
            const montoElement = $('#detail-monto');
            const isGasto = trx.tipo === 'gasto';
            const amountColor = isGasto ? '#ff4757' : '#34d399'; 
            const amountSign = isGasto ? '-' : '+';
            montoElement.textContent = `${amountSign}${formatCurrency(trx.monto)}`;
            montoElement.style.color = amountColor; 

            $('#detail-categoria').textContent = trx.categoria;
            $('#detail-fecha').textContent = trx.fecha; // Mostrar la fecha tal cual para la vista de detalles
            $('#detail-metodoPago').textContent = trx.metodoPago || 'N/A';
            $('#detail-descripcion').textContent = trx.descripcion || 'Sin descripción.';

            // Manejo de Recibo (Imagen)
            const reciboImg = $('#detail-recibo');
            const noReciboMsg = $('#no-recibo-msg');
            
            if (trx.recibo) {
                reciboImg.src = trx.recibo; // Base64 Data URL
                reciboImg.style.display = 'block';
                noReciboMsg.style.display = 'none';
            } else {
                reciboImg.src = '';
                reciboImg.style.display = 'none';
                noReciboMsg.style.display = 'block';
            }
            
            detailsModal.classList.add('active');
        } else {
            alert('Transacción no encontrada.');
        }
    } catch (error) {
        console.error("Error al cargar detalles de la transacción:", error);
    }
}


/* ================================================= */
/* 6. Manejo de Eventos (Listeners)      */
/* ================================================= */

// ---------------------------------------------------
// A. Manejo de Modales (Abrir/Cerrar)
// ---------------------------------------------------

btnNuevoGasto.addEventListener('click', () => {
    // Restablece el formulario al abrir
    expenseForm.reset();
    newExpenseModal.classList.add('active');
    // Establecer fecha actual por defecto
    document.getElementById('fecha').valueAsDate = new Date();
});

closeButtons.forEach(button => {
    button.addEventListener('click', () => {
        newExpenseModal.classList.remove('active');
    });
});

$('#closeDetailsModal').addEventListener('click', () => {
    detailsModal.classList.remove('active');
});

// ---------------------------------------------------
// B. Guardar Nueva Transacción
// ---------------------------------------------------
expenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(expenseForm);
    const newTrx = {
        tipo: formData.get('tipo'),
        monto: parseFloat(formData.get('monto')),
        categoria: formData.get('categoria'),
        fecha: formData.get('fecha'),
        metodoPago: formData.get('metodoPago'),
        descripcion: formData.get('descripcion'),
        recibo: null // Se llenará si hay un archivo
    };
    
    const reciboFile = document.getElementById('recibo').files[0];

    if (reciboFile) {
        const reader = new FileReader();
        reader.onload = async (event) => {
            newTrx.recibo = event.target.result; // Guarda el archivo como Base64
            await window.guardarTransaccion(newTrx);
            newExpenseModal.classList.remove('active');
            aplicarFiltro(); // Recargar el dashboard
        };
        reader.readAsDataURL(reciboFile);
    } else {
        await window.guardarTransaccion(newTrx);
        newExpenseModal.classList.remove('active');
        aplicarFiltro(); // Recargar el dashboard
    }
});


// ---------------------------------------------------
// C. Eliminar Transacción y Mostrar Detalles (Delegación)
// ---------------------------------------------------

document.body.addEventListener('click', (event) => {
    
    // 1. Manejo de la Eliminación
    const deleteButton = event.target.closest('.delete-button');
    if (deleteButton) {
        const transactionId = deleteButton.getAttribute('data-id');
        if (confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
            window.eliminarTransaccion(transactionId)
                .then(() => {
                    console.log('Transacción eliminada con éxito');
                    aplicarFiltro(); // Recargar el dashboard
                })
                .catch(error => console.error('Error al eliminar:', error));
            return; // Detiene el procesamiento para evitar que active el modal de detalles
        }
    }
    
    // 2. Manejo de Mostrar Detalles
    const detailsItem = event.target.closest('.view-details');
    // Aseguramos que no se haya clicado en el botón de basura
    const isDeleteButton = event.target.closest('.delete-button');

    if (detailsItem && !isDeleteButton) { 
        const transactionId = detailsItem.getAttribute('data-id');
        if (transactionId && transactionId !== 'temp') {
            mostrarDetallesTransaccion(transactionId);
        }
    }
});

// ---------------------------------------------------
// D. Aplicar Filtro
// ---------------------------------------------------
filterSelect.addEventListener('change', aplicarFiltro);


/* ================================================= */
/* 7. Inicialización de la Aplicación    */
/* ================================================= */

// Función principal que se ejecuta al cargar la página
window.addEventListener('load', () => {
    aplicarFiltro(); // Carga las transacciones y métricas iniciales
});