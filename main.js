document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Control del Modal y Referencias ---
    const modalOverlay = document.getElementById('newExpenseModal'); 
    const expenseForm = document.querySelector('.expense-form');
    const newExpenseButton = document.getElementById('btnNuevoGasto');
    const closeButton = document.querySelector('.modal-header .close-button'); 
    const cancelButton = document.querySelector('.form-actions .cancel-button');

    function openModal() {
        if(modalOverlay) modalOverlay.classList.add('active');
    }

    function closeModal() {
        if(modalOverlay) modalOverlay.classList.remove('active');
        expenseForm.reset(); // Resetea el formulario al cerrar
    }

    // --- 2. Event Listeners de Botones ---
    if (newExpenseButton) newExpenseButton.addEventListener('click', openModal);
    if (closeButton) closeButton.addEventListener('click', closeModal);
    if (cancelButton) cancelButton.addEventListener('click', closeModal); 
    
    // Listener para cerrar al hacer clic fuera del modal
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(event) {
            if (event.target === modalOverlay) {
                closeModal();
            }
        });
    }

    // --- Funciones Auxiliares de Actualización de Métricas ---

    function actualizarMetricasGastos(transaccionesGastos, totalGastado, numGastos) {
        const gastoPromedio = numGastos > 0 ? totalGastado / numGastos : 0;
        
        // 1. ACTUALIZAR MÉTRICAS DE GASTOS
        const gastoTotalCard = document.getElementById('gastoTotalValue');
        if (gastoTotalCard) gastoTotalCard.textContent = `$${totalGastado.toFixed(2)}`;
        
        const gastoNumeroCard = document.getElementById('gastoNumeroValue');
        if (gastoNumeroCard) gastoNumeroCard.textContent = numGastos;

        const gastoPromedioCard = document.getElementById('gastoPromedioValue');
        if (gastoPromedioCard) gastoPromedioCard.textContent = `$${gastoPromedio.toFixed(2)}`;
        
        const gastoCategoriasCard = document.getElementById('gastoCategoriasValue');
        // NOTA: La lógica para contar categorías distintas requeriría más código. Por ahora se deja 0.
        if (gastoCategoriasCard) gastoCategoriasCard.textContent = 0; 
    }

    function actualizarMetricasIngresos(transaccionesIngresos, totalIngresado, numIngresos) {
        const ingresoPromedio = numIngresos > 0 ? totalIngresado / numIngresos : 0;
        
        // 2. ACTUALIZAR MÉTRICAS DE INGRESOS
        const ingresoTotalCard = document.getElementById('ingresoTotalValue');
        if (ingresoTotalCard) ingresoTotalCard.textContent = `$${totalIngresado.toFixed(2)}`;
        
        const ingresoNumeroCard = document.getElementById('ingresoNumeroValue');
        if (ingresoNumeroCard) ingresoNumeroCard.textContent = numIngresos;

        const ingresoPromedioCard = document.getElementById('ingresoPromedioValue');
        if (ingresoPromedioCard) ingresoPromedioCard.textContent = `$${ingresoPromedio.toFixed(2)}`;

        const ingresoCategoriasCard = document.getElementById('ingresoCategoriasValue');
        // NOTA: La lógica para contar categorías distintas requeriría más código. Por ahora se deja 0.
        if (ingresoCategoriasCard) ingresoCategoriasCard.textContent = 0; 
    }


    // --- Funciones de Renderizado de Listas ---
    
    function crearElementoTransaccion(transaccion) {
        const isGasto = transaccion.tipo === 'gasto';
        const amountClass = isGasto ? 't-amount gasto' : 't-amount ingreso';
        const amountSign = isGasto ? '-' : '+';
        const amountColor = isGasto ? '#ff4757' : '#34d399'; 
        
        // Formateo de fecha
        const dateOptions = { day: '2-digit', month: 'short' };
        let formattedDate = '';
        try {
            formattedDate = new Date(transaccion.fecha).toLocaleDateString('es-ES', dateOptions);
        } catch (e) {
            formattedDate = transaccion.fecha; 
        }
        
        const formattedAmount = `${amountSign}$${transaccion.monto.toFixed(2)}`;
        const transactionId = transaccion.id || 'temp'; 

        return `
            <div class="transaction-item">
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
                    <i class="fas fa-trash-alt" data-id="${transactionId}"></i>
                </div>
            </div>
        `;
    }

    function actualizarListaTransacciones(transacciones) {
        const gastoListContainer = document.getElementById('gasto-list');
        const ingresoListContainer = document.getElementById('ingreso-list');

        if (!gastoListContainer || !ingresoListContainer) return;

        // Obtener transacciones filtradas
        const transaccionesGastos = transacciones.filter(t => t.tipo === 'gasto');
        const transaccionesIngresos = transacciones.filter(t => t.tipo === 'ingreso');

        // Limpiar listas anteriores
        gastoListContainer.innerHTML = '';
        ingresoListContainer.innerHTML = '';
        
        const emptyMessageGasto = '<div class="empty-list-message">No hay gastos registrados.</div>';
        const emptyMessageIngreso = '<div class="empty-list-message">No hay ingresos registrados.</div>';


        // 1. Dibujar Gastos o mostrar mensaje
        if (transaccionesGastos.length === 0) {
            gastoListContainer.innerHTML = emptyMessageGasto;
        } else {
            transaccionesGastos.forEach(t => {
                gastoListContainer.innerHTML += crearElementoTransaccion(t);
            });
        }

        // 2. Dibujar Ingresos o mostrar mensaje
        if (transaccionesIngresos.length === 0) {
            ingresoListContainer.innerHTML = emptyMessageIngreso;
        } else {
            transaccionesIngresos.forEach(t => {
                ingresoListContainer.innerHTML += crearElementoTransaccion(t);
            });
        }
    }


    // --- Función Principal de Lectura y Actualización (GLOBAL) ---
    // Esta función se llama al inicio y después de guardar una transacción.
    window.cargarYActualizarMetricas = function() {
        console.log('Cargando y actualizando métricas...');
        
        // Asumiendo que window.obtenerTodasLasTransacciones() existe en db.js
        window.obtenerTodasLasTransacciones() 
            .then(transacciones => {
                // Filtrado
                const transaccionesGastos = transacciones.filter(t => t.tipo === 'gasto');
                const transaccionesIngresos = transacciones.filter(t => t.tipo === 'ingreso');

                // Cálculo de totales
                const totalGastado = transaccionesGastos.reduce((sum, t) => sum + t.monto, 0);
                const totalIngresado = transaccionesIngresos.reduce((sum, t) => sum + t.monto, 0);
                
                const numGastos = transaccionesGastos.length;
                const numIngresos = transaccionesIngresos.length;

                // Actualizar la vista
                actualizarMetricasGastos(transaccionesGastos, totalGastado, numGastos);
                actualizarMetricasIngresos(transaccionesIngresos, totalIngresado, numIngresos);
                actualizarListaTransacciones(transacciones);

                console.log('Métricas de Dashboard actualizadas.');
            })
            .catch(err => {
                console.error('Error al cargar transacciones:', err);
            });
    }; 

    // --- 4. Event Listener del Formulario (Submit) ---
    if (expenseForm) {
        expenseForm.addEventListener('submit', function(event) {
            event.preventDefault(); 
        
            const transactionData = {
                tipo: expenseForm.querySelector('#filter-trx').value,
                monto: parseFloat(expenseForm.querySelector('#monto').value),
                categoria: expenseForm.querySelector('#categoria').value,
                fecha: expenseForm.querySelector('#fecha').value,
                metodoPago: expenseForm.querySelector('#metodoPago').value,
                descripcion: expenseForm.querySelector('#descripcion').value,
                recibo: null // Manejo de archivos (recibo) más complejo, por ahora se deja en null
            };

            if (isNaN(transactionData.monto) || transactionData.monto <= 0 || !transactionData.categoria || !transactionData.fecha) {
                alert("Por favor, complete todos los campos obligatorios (*).");
                return;
            }

            // Asumiendo que 'guardarTransaccion' existe en db.js
            window.guardarTransaccion(transactionData) 
                .then(mensaje => {
                    console.log(mensaje);
                    closeModal(); // Cierra el modal y resetea el formulario
                    
                    // Refresca todo el dashboard
                    cargarYActualizarMetricas(); 
                })
                .catch(error => {
                    alert('Error al guardar la transacción. Revise la consola: ' + error.message);
                });
        });
    }

    // --- 5. Llamada inicial al cargar la página ---
    window.cargarYActualizarMetricas();
});