/*:
 * @plugindesc Завершает игру, если HP персонажа с ID 1 достигает 0 на карте.
 * @author Ваше имя
 *
 * @help
 * Этот плагин автоматически завершает игру, если HP актёра с ID 1
 * становится равным 0 вне битвы (на карте).
 * Перед проверкой автоматически применяет нокаут, если HP <= 0.
 */

(function() {
    // Сохраняем оригинальный метод decreaseHp
    var _Game_Actor_decreaseHp = Game_Actor.prototype.decreaseHp;
    
    Game_Actor.prototype.decreaseHp = function(value) {
        _Game_Actor_decreaseHp.call(this, value);
        
        // Проверяем, что это актёр с ID 1, его HP <= 0 и мы не в битве
        if (this.actorId() === 1 && this.hp <= 0 && !$gameParty.inBattle()) {
            // Принудительно применяем нокаут, если персонаж ещё не в нокауте
            if (!this.isDead()) {
                this.addState(this.deathStateId());
            }
            
            // Проверяем HP снова после применения нокаута
            if (this.hp <= 0) {
                // Вызываем экран Game Over
                SceneManager.goto(Scene_Gameover);
            }
        }
    };
})();