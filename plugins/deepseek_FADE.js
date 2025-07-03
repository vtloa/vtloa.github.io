//=============================================================================
// GradualEventOpacity.js
//=============================================================================
/*:
 * @plugindesc Плагин для постепенного изменения прозрачности события при активации.
 * @author Ваше имя
 *
 * @help
 * Чтобы использовать плагин:
 * 1. Установите плагин через менеджер плагинов
 * 2. В событии, которое должно становиться прозрачным, добавьте вызов плагина:
 *    Плагиновая команда: GradualOpacity duration frames
 *    где duration - время в кадрах (60 кадров = 1 секунда)
 * 
 * Пример: GradualOpacity 120 - сделает событие полностью прозрачным за 2 секунды
 */

(function() {
    // Обработчик плагинных команд
    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        
        if (command === 'GradualOpacity') {
            var duration = parseInt(args[0]) || 60;
            var event = this._eventId > 0 ? $gameMap.event(this._eventId) : null;
            
            if (event) {
                event.startOpacityChange(duration);
            }
        }
    };

    // Добавляем метод для изменения прозрачности
    Game_Event.prototype.startOpacityChange = function(duration) {
        this._opacityChangeDuration = duration;
        this._opacityChangeFrames = 0;
        this._originalOpacity = this._opacity;
    };

    // Обновляем прозрачность каждый кадр
    var _Game_Event_update = Game_Event.prototype.update;
    Game_Event.prototype.update = function() {
        _Game_Event_update.call(this);
        
        if (this._opacityChangeDuration) {
            this._opacityChangeFrames++;
            var progress = this._opacityChangeFrames / this._opacityChangeDuration;
            progress = Math.min(progress, 1.0);
            
            this._opacity = Math.floor(this._originalOpacity * (1 - progress));
            
            if (this._opacityChangeFrames >= this._opacityChangeDuration) {
                this._opacityChangeDuration = 0;
            }
        }
    };
})();