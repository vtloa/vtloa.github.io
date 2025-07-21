// Плагин: PermanentEventRemoval
// Автор: Ваше имя
// Описание: Позволяет навсегда удалять события с карты при их активации

var Imported = Imported || {};
Imported.PermanentEventRemoval = true;

var PERS = PERS || {};

(function() {
    // Хранилище удаленных событий
    PERS.removedEvents = {};
    
    // Переопределяем метод загрузки карты
    var _Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        _Game_Map_setup.call(this, mapId);
        this.restoreRemovedEvents();
    };
    
    // Восстанавливаем события (точнее, проверяем какие нужно удалить)
    Game_Map.prototype.restoreRemovedEvents = function() {
        var key = this.getStorageKey();
        if (PERS.removedEvents[key]) {
            for (var eventId in PERS.removedEvents[key]) {
                this._events[eventId] = null;
            }
        }
    };
    
    // Получаем уникальный ключ для хранения данных о текущей карте
    Game_Map.prototype.getStorageKey = function() {
        return $dataMap.id + '_' + this._mapId;
    };
    
    // Метод для удаления события
    Game_Map.prototype.permanentlyRemoveEvent = function(eventId) {
        this._events[eventId] = null;
        var key = this.getStorageKey();
        if (!PERS.removedEvents[key]) {
            PERS.removedEvents[key] = {};
        }
        PERS.removedEvents[key][eventId] = true;
    };
    
    // Переопределяем метод выполнения команды плагина
    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === 'PERS' && args[0] === 'remove') {
            var eventId = this._eventId;
            if (eventId > 0) {
                $gameMap.permanentlyRemoveEvent(eventId);
            }
        }
    };
})();