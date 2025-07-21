/*:
 * @target MV
 * @plugindesc Атака мечом и активация событий по комментарию. E для удара или взаимодействия.
 * @help
 * Добавьте условие: "Если HP <= 0 → Удалить событие".
 * E для атаки или активации событий с комментарием <interact>.
 */

(function() {
    // Настройки
    const ACTION_KEY = "e";         // Кнопка действия
    const SWORD_DAMAGE = 1;         // Урон за удар
    const SWORD_SPRITE = "Sword";   // Спрайт меча (img/characters/)
    const ACTIVATE_RANGE = 1;       // Дистанция активации событий (в клетках)
    const ACTIVATE_TAG = "interact"; // Тег в комментариях для активации

    Input.isCustomTriggered = function(key) {
        return Input.isPressed(KEY_MAP[key]);
    };

    // Загрузка спрайта
    ImageManager.loadCharacter(SWORD_SPRITE);

    let swordSprite = null;

    // Переопределение update
    var _Game_Player_update = Game_Player.prototype.update;
    Game_Player.prototype.update = function() {
        _Game_Player_update.apply(this, arguments);
        
        if (Input.isTriggered(ACTION_KEY)) {
            this.tryActivateEvent(); // Активируем событие, но не прерываем атаку
            if (!swordSprite) {
                this.swingSword(); // Меч появится в любом случае
            }
        }
    };

    // Проверка комментариев события на наличие тега
    Game_Event.prototype.hasActivateTag = function() {
        const list = this.event().pages[0].list;
        for (let i = 0; i < list.length; i++) {
            if (list[i].code === 108 || list[i].code === 408) {
                if (list[i].parameters[0].includes(`<${ACTIVATE_TAG}>`)) {
                    return true;
                }
            }
        }
        return false;
    };

    // Попытка активации события (проверяем комментарии)
    Game_Player.prototype.tryActivateEvent = function() {
        let targetX = this.x;
        let targetY = this.y;
        
        // Клетка перед игроком
        switch(this.direction()) {
            case 2: targetY++; break;
            case 4: targetX--; break;
            case 6: targetX++; break;
            case 8: targetY--; break;
        }
        
        // Ищем события в радиусе ACTIVATE_RANGE
        let eventActivated = false;
        $gameMap.events().forEach(event => {
            const dx = Math.abs(event.x - targetX);
            const dy = Math.abs(event.y - targetY);
            
            if (dx <= ACTIVATE_RANGE && dy <= ACTIVATE_RANGE && event.isTriggerIn([0, 1, 2])) {
                // Проверяем комментарии события
                if (event.hasActivateTag()) {
                    event.start();
                    eventActivated = true;
                }
            }
        });
        
        return eventActivated;
    };

    Game_Player.prototype.swingSword = function() {
        // Создаем спрайт меча
        swordSprite = new Sprite(ImageManager.loadCharacter(SWORD_SPRITE));
        swordSprite.anchor.set(0.5, 1);
        SceneManager._scene._spriteset.addChild(swordSprite);

        // ===== 1. Определяем центр персонажа =====
        const baseX = this.screenX();
        const baseY = this.screenY();
        const charHeight = 32; // Объявляем ОДИН раз (32 или 48 в зависимости от спрайта)
        
        const centerX = baseX;
        const centerY = baseY - charHeight / 2;

        // ===== 3. Направление и поворот =====
        let baseAngle = 0;
        switch(this.direction()) {
            case 2: baseAngle = Math.PI / 2; break;
            case 4: baseAngle = Math.PI; break;
            case 6: baseAngle = 0; break;
            case 8: baseAngle = -Math.PI / 2; break;
        }
        swordSprite.rotation = baseAngle;

        // ===== 4. Позиция меча =====
        swordSprite.x = centerX;
        swordSprite.y = centerY;

        // ===== 5. Анимация движения =====
        const offset = 36;
        let targetX = centerX;
        let targetY = centerY;
        
        switch(this.direction()) {
            case 2: targetY += offset; break;
            case 4: targetX -= offset; break;
            case 6: targetX += offset; break;
            case 8: targetY -= offset; break;
        }

        const duration = 200;
        const startTime = Date.now();
        
        swordSprite.animationInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Движение меча
            swordSprite.x = centerX + (targetX - centerX) * progress;
            swordSprite.y = centerY + (targetY - centerY) * progress;
            
            // Увеличенный поворот на 90°
            swordSprite.rotation = baseAngle + (Math.PI / 2 * progress);

            swordSprite.rotation = baseAngle + (Math.PI * 2 * progress); // 360°
            //swordSprite.x = centerX + (targetX - centerX) * progress + 0 * Math.sin(progress * Math.PI * 2); 

            if (progress >= 1) clearInterval(swordSprite.animationInterval);
        }, 16);

        AudioManager.playSe({ name: "взмах мечом", volume: 40, pitch: 90 });
        this.dealDamage();

        setTimeout(() => {
            if (swordSprite) {
                clearInterval(swordSprite.animationInterval);
                // Добавляем проверку на существование сцены и спрайтсета
                if (SceneManager._scene && SceneManager._scene._spriteset) {
                    SceneManager._scene._spriteset.removeChild(swordSprite);
                }
                swordSprite = null;
            }
        }, 300);
    };

    // Нанесение урона
    Game_Player.prototype.dealDamage = function() {
        let targetX = this.x;
        let targetY = this.y;
        
        // Клетка перед игроком
        switch(this.direction()) {
            case 2: targetY++; break;
            case 4: targetX--; break;
            case 6: targetX++; break;
            case 8: targetY--; break;
        }
        
        // Ищем врагов
        $gameMap.events().forEach(event => {
            if (event.x === targetX && event.y === targetY) {
                // Уменьшаем переменную с ID 41 (HP)
                const hpVarId = 41;
                $gameVariables.setValue(hpVarId, $gameVariables.value(hpVarId) - SWORD_DAMAGE);
                console.log(`Удар! HP врага: ${$gameVariables.value(hpVarId)}`);
            }
        });
    };
})();