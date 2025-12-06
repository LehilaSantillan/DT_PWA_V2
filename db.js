const DB_NAME = 'gastos_db';
const DB_VERSION = 1; 
let db;

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (e) => {
            db = e.target.result;
            if (!db.objectStoreNames.contains('transacciones')) {
                const store = db.createObjectStore('transacciones', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                store.createIndex('fecha_idx', 'fecha');
                store.createIndex('tipo_idx', 'tipo'); // Índice crucial para filtrar Ingreso/Gasto
            }
            console.log('Base de datos y Object Store creados/actualizados.');
        };

        request.onsuccess = (e) => {
            db = e.target.result;
            console.log('IndexedDB abierto con éxito.');
            resolve(db);
        };

        request.onerror = (e) => {
            console.error('Error al abrir IndexedDB:', e.target.error);
            reject(e.target.error);
        };
    });
}

// -----------------------------------------------------
// FUNCIÓN DE GUARDADO 
// -----------------------------------------------------
window.guardarTransaccion = function(transaccion) {
    return openDB().then(db => {
        const transaction = db.transaction('transacciones', 'readwrite');
        const store = transaction.objectStore('transacciones');
        
        return new Promise((resolve, reject) => {
            const request = store.add(transaccion);
            
            request.onsuccess = () => resolve('Transacción guardada con ID: ' + request.result);
            request.onerror = (e) => reject(e.target.error);
            
            transaction.oncomplete = () => console.log("Transacción de guardado completada.");
            transaction.onerror = (e) => reject(e.target.error);
        });
    });
}

// -----------------------------------------------------
// FUNCIÓN DE LECTURA 
// -----------------------------------------------------
window.obtenerTodasLasTransacciones = function() {
    return openDB().then(db => {
        const transaction = db.transaction('transacciones', 'readonly');
        const store = transaction.objectStore('transacciones');
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e.target.error);
        });
    });
}

// -----------------------------------------------------
// FUNCIÓN DE ELIMINACIÓN
// -----------------------------------------------------
window.eliminarTransaccion = function(id) {
    // Asegúrate de que el ID es un número entero
    const idAEliminar = parseInt(id, 10); 
    
    return openDB().then(db => {
        const transaction = db.transaction('transacciones', 'readwrite');
        const store = transaction.objectStore('transacciones');
        
        return new Promise((resolve, reject) => {
            // Utilizamos el método delete() para eliminar por keyPath (id)
            const request = store.delete(idAEliminar); 
            
            request.onsuccess = () => resolve('Transacción eliminada con ID: ' + idAEliminar);
            request.onerror = (e) => reject(e.target.error);
            
            transaction.oncomplete = () => console.log("Transacción de eliminación completada.");
            transaction.onerror = (e) => reject(e.target.error);
        });
    });
}

openDB();