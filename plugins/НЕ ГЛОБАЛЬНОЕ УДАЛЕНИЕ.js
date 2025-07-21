// Плагин: PermanentEventRemoval
// Автор: Ваше имя
// Описание: Позволяет навсегда удалять события с карты при их активации (только для текущей игровой сессии)

var Imported = Imported || {};
Imported.PermanentEventRemoval = true;

(function() {
    // Хранилище удаленных событий (привязано к сохранению)
    var _removedEvents = {};
    
    // Переопределяем метод загрузки карты
    var _Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        _Game_Map_setup.call(this, mapId);
        this.restoreRemovedEvents();
    };
    
    // Восстанавливаем события (точнее, проверяем какие нужно удалить)
    Game_Map.prototype.restoreRemovedEvents = function() {
        var key = this.getStorageKey();
        if (_removedEvents[key]) {
            for (var eventId in _removedEvents[key]) {
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
        if (!_removedEvents[key]) {
            _removedEvents[key] = {};
        }
        _removedEvents[key][eventId] = true;
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
    
    // Сбрасываем данные при новой игре
    var _DataManager_setupNewGame = DataManager.setupNewGame;
    DataManager.setupNewGame = function() {
        _DataManager_setupNewGame.call(this);
        _removedEvents = {}; // Очищаем список удаленных событий
    };
    
    // Сохраняем и загружаем данные удаленных событий
    var _DataManager_makeSaveContents = DataManager.makeSaveContents;
    DataManager.makeSaveContents = function() {
        var contents = _DataManager_makeSaveContents.call(this);
        contents.removedEvents = _removedEvents;
        return contents;
    };
    
    var _DataManager_extractSaveContents = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function(contents) {
        _DataManager_extractSaveContents.call(this, contents);
        _removedEvents = contents.removedEvents || {};
    };
})();