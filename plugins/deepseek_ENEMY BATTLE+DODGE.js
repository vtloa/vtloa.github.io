/*:
 * @plugindesc Улучшенная система врагов с уворотом
 * @author Ваше имя
 *
 * @help
 * Добавьте в название события:
 * [ENEMY] Имя (HP: 100) (DMG: 10) (CD: 60) (Parry: 2)
 * 
 * Уворот: нажмите SHIFT для активации уворота (80% шанс избежать урона на 3 секунды, кулдаун 5 секунд)
 */

(function() {
    'use strict';

    // Хранилище данных врагов
    var enemies = new Map();
    var damageEffects = [];
    var isDodging = false;
    var dodgeActive = false;
    var dodgeTimer = 0;
    var dodgeDuration = 180; // 3 секунды (60 кадров = 1 секунда)
    var dodgeCooldown = 0;
    var dodgeMaxCooldown = 300; // 5 секунд
    var dodgeChance = 0.8; // 80% шанс уворота
    var dodgeIndicator = null;

    // Генератор уникального ID для врага
    function generateUniqueId(event) {
        return $gameMap.mapId() + '_' + event.eventId() + '_' + event.x + '_' + event.y + '_' + Date.now();
    }

    // Парсинг данных врага из названия события
    function parseEnemyData(event) {
        if (!event || !event.event()) return null;
        
        var name = event.event().name;
        if (!name.includes('[ENEMY]')) return null;
        
        var match = name.match(/\[ENEMY\]\s*(.+?)\s*\(HP:\s*(\d+)\)\s*\(DMG:\s*(\d+)\)\s*\(CD:\s*(\d+)\)\s*(\(Parry:\s*(\d+)\))?/i);
        if (!match) return null;
        
        if (!event._enemyId) {
            event._enemyId = generateUniqueId(event);
        }
        
        if (!enemies.has(event._enemyId)) {
            enemies.set(event._enemyId, {
                name: match[1],
                maxHp: parseInt(match[2]),
                hp: parseInt(match[2]),
                damage: parseInt(match[3]),
                cooldown: parseInt(match[4]),
                parry: match[6] ? parseInt(match[6]) : 0,
                attackTimer: 0,
                sprite: null,
                defeated: false
            });
        }
        
        return enemies.get(event._enemyId);
    }

    // Класс для эффекта урона
    function DamageEffect(value, x, y, isPlayer) {
        this.value = value;
        this.x = x;
        this.y = y;
        this.opacity = 255;
        this.lifetime = 60;
        this.isPlayer = isPlayer || false;
        
        this.sprite = new Sprite(new Bitmap(100, 40));
        this.sprite.bitmap.fontSize = 20;
        this.sprite.bitmap.textColor = this.isPlayer ? "#FF0000" : "#FF9900";
        this.sprite.bitmap.outlineColor = "#FFFFFF";
        this.sprite.bitmap.outlineWidth = 4;
        this.sprite.bitmap.drawText(this.isPlayer ? '-' + value : value, 0, 0, 100, 40, 'center');
        this.sprite.x = x - 50;
        this.sprite.y = y - 50;
    }

    DamageEffect.prototype.update = function() {
        this.lifetime--;
        this.y -= 1;
        this.opacity -= 4;
        this.sprite.y = this.y - 50;
        this.sprite.opacity = this.opacity;
        return this.lifetime > 0;
    };

    // Класс для эффекта уворота
    function DodgeEffect(x, y) {
        this.x = x;
        this.y = y;
        this.opacity = 255;
        this.lifetime = 60;
        
        this.sprite = new Sprite(new Bitmap(100, 40));
        this.sprite.bitmap.fontSize = 20;
        this.sprite.bitmap.textColor = "#00FF88";
        this.sprite.bitmap.outlineColor = "#FFFFFF";
        this.sprite.bitmap.outlineWidth = 4;
        this.sprite.bitmap.drawText("УВОРОТ", 0, 0, 100, 40, 'center');
        this.sprite.x = x - 50;
        this.sprite.y = y - 50;
    }

    DodgeEffect.prototype.update = function() {
        this.lifetime--;
        this.y -= 1;
        this.opacity -= 4;
        this.sprite.y = this.y - 50;
        this.sprite.opacity = this.opacity;
        return this.lifetime > 0;
    };

    // Создание индикатора уворота
    function createDodgeIndicator() {
        dodgeIndicator = new Sprite(new Bitmap(140, 50));
        dodgeIndicator.bitmap.fontSize = 16;
        dodgeIndicator.x = Graphics.width - 160;
        dodgeIndicator.y = 20;
        dodgeIndicator.z = 10;
        SceneManager._scene.addChild(dodgeIndicator);
        updateDodgeIndicator();
    }

    // Обновление индикатора уворота
    function updateDodgeIndicator() {
        if (!dodgeIndicator) return;
        
        var bitmap = dodgeIndicator.bitmap;
        bitmap.clear();
        
        if (dodgeCooldown > 0) {
            var progress = 1 - (dodgeCooldown / dodgeMaxCooldown);
            bitmap.textColor = "#FF5555";
            bitmap.drawText("УВОРОТ: " + Math.ceil(dodgeCooldown/60) + "с", 0, 0, 140, 20, 'left');
            
            // Полоска кулдауна
            bitmap.fillRect(0, 25, 140, 10, "#333333"); // Фон
            bitmap.fillRect(0, 25, 140 * progress, 10, "#FF5555"); // Прогресс
        } else if (dodgeActive) {
            var timeLeft = Math.ceil((dodgeDuration - dodgeTimer)/60);
            var activeProgress = 1 - (dodgeTimer / dodgeDuration);
            bitmap.textColor = "#00FF88";
            bitmap.drawText("УВОРОТ АКТИВЕН: " + timeLeft + "с", 0, 0, 140, 20, 'left');
            bitmap.fillRect(0, 25, 140, 10, "#333333"); // Фон
            bitmap.fillRect(0, 25, 140 * activeProgress, 10, "#00FF88"); // Прогресс
        } else {
            bitmap.textColor = "#00AAFF";
            bitmap.drawText("УВОРОТ ГОТОВ", 0, 0, 140, 20, 'left');
            bitmap.fillRect(0, 25, 140, 10, "#00AAFF");
        }
    }

    // Переопределение методов сцены
    var _Scene_Map_createDisplayObjects = Scene_Map.prototype.createDisplayObjects;
    Scene_Map.prototype.createDisplayObjects = function() {
        _Scene_Map_createDisplayObjects.call(this);
        createDodgeIndicator();
    };

    var _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        this.updateEffects();
        
        // Активация уворота по SHIFT
        if (Input.isTriggered('shift') && dodgeCooldown <= 0 && !dodgeActive) {
            dodgeActive = true;
            dodgeTimer = 0;
            AudioManager.playSe({ name: 'Evasion', volume: 90, pitch: 100, pan: 0 });
        }
        
        // Обновление таймеров уворота
        if (dodgeActive) {
            dodgeTimer++;
            if (dodgeTimer >= dodgeDuration) {
                dodgeActive = false;
                dodgeCooldown = dodgeMaxCooldown;
            }
            updateDodgeIndicator();
        }
        
        if (dodgeCooldown > 0) {
            dodgeCooldown--;
            updateDodgeIndicator();
        }
        
        if (Input.isTriggered('ok') || Input.isTriggered('space')) {
            this.playerAttack();
        }
        
        this.updateEnemyAI();
    };

    Scene_Map.prototype.updateEffects = function() {
        for (var i = damageEffects.length - 1; i >= 0; i--) {
            if (!damageEffects[i].update()) {
                this._spriteset.removeChild(damageEffects[i].sprite);
                damageEffects.splice(i, 1);
            }
        }
    };

    Scene_Map.prototype.playerAttack = function() {
        var player = $gamePlayer;
        var events = $gameMap.events();
        
        for (var i = 0; i < events.length; i++) {
            var event = events[i];
            if (!event) continue;
            
            var enemyData = parseEnemyData(event);
            if (!enemyData || enemyData.defeated) continue;
            
            if (this.isInRange(player, event, 2)) {
                this.attackEnemy(event, enemyData);
                return;
            }
        }
    };

    Scene_Map.prototype.attackEnemy = function(event, enemyData) {
        var damage = 10 + Math.floor(Math.random() * 20);
        enemyData.hp = Math.max(0, enemyData.hp - damage);
        
        // Эффект урона врагу
        var sprite = this.findEventSprite(event);
        if (sprite) {
            var effect = new DamageEffect(damage, sprite.x + sprite.width / 2, sprite.y - 20);
            this._spriteset.addChild(effect.sprite);
            damageEffects.push(effect);
        }
        
        AudioManager.playSe({ name: 'Sword1', volume: 90, pitch: 100, pan: 0 });
        
        // Контратака с учетом Parry
        if (Math.random() < 0.5 && !enemyData.defeated) {
            var counterDamage = enemyData.parry > 0 ? enemyData.parry : enemyData.damage;
            this.enemyAttackPlayer(event, enemyData, counterDamage);
        }
        
        if (enemyData.hp <= 0) {
            enemyData.defeated = true;
            $gameSelfSwitches.setValue([$gameMap.mapId(), event.eventId(), 'A'], true);
            event.refresh();
            AudioManager.playSe({ name: 'Collapse2', volume: 90, pitch: 100, pan: 0 });
        }
    };

    Scene_Map.prototype.findEventSprite = function(event) {
        if (!this._spriteset || !this._spriteset._characterSprites) return null;
        for (var i = 0; i < this._spriteset._characterSprites.length; i++) {
            var sprite = this._spriteset._characterSprites[i];
            if (sprite._character === event) {
                return sprite;
            }
        }
        return null;
    };

    Scene_Map.prototype.updateEnemyAI = function() {
        var player = $gamePlayer;
        var events = $gameMap.events();
        
        for (var i = 0; i < events.length; i++) {
            var event = events[i];
            if (!event) continue;
            
            var enemyData = parseEnemyData(event);
            if (!enemyData || enemyData.defeated) continue;
            
            if (enemyData.attackTimer > 0) {
                enemyData.attackTimer--;
                continue;
            }
            
            if (this.isInRange(player, event, 1)) {
                this.enemyAttackPlayer(event, enemyData, enemyData.damage);
                enemyData.attackTimer = enemyData.cooldown;
            }
        }
    };

    Scene_Map.prototype.enemyAttackPlayer = function(event, enemyData, damage) {
        var playerSprite = this._spriteset._characterSprites.find(function(sprite) {
            return sprite._character === $gamePlayer;
        });
        
        // Проверка уворота
        if (dodgeActive && Math.random() < dodgeChance) {
            // Эффект уворота
            if (playerSprite) {
                var effect = new DodgeEffect(
                    playerSprite.x + playerSprite.width / 2, 
                    playerSprite.y - 20
                );
                this._spriteset.addChild(effect.sprite);
                damageEffects.push(effect);
            }
            AudioManager.playSe({ name: 'Evasion', volume: 90, pitch: 120, pan: 0 });
            return; // Урон не наносится при успешном увороте
        }
        
        // Нанесение урона, если уворот не сработал
        var actor = $gameParty.leader();
        actor.gainHp(-damage);
        
        // Эффект урона игроку
        if (playerSprite) {
            var effect = new DamageEffect(damage, 
                playerSprite.x + playerSprite.width / 2, 
                playerSprite.y - 20, 
                true);
            this._spriteset.addChild(effect.sprite);
            damageEffects.push(effect);
        }
        
        AudioManager.playSe({ name: 'Sword2', volume: 90, pitch: 80, pan: 0 });
        
        if (actor.isDead()) {
            actor.performCollapse();
        }
    };

    Scene_Map.prototype.isInRange = function(char1, char2, range) {
        return Math.abs(char1.x - char2.x) <= range && 
               Math.abs(char1.y - char2.y) <= range;
    };

    // Отображение HP врага
    var _Sprite_Character_initMembers = Sprite_Character.prototype.initMembers;
    Sprite_Character.prototype.initMembers = function() {
        _Sprite_Character_initMembers.call(this);
        this._enemyInfo = null;
    };

    var _Sprite_Character_update = Sprite_Character.prototype.update;
    Sprite_Character.prototype.update = function() {
        _Sprite_Character_update.call(this);
        
        if (this._character instanceof Game_Event) {
            var enemyData = parseEnemyData(this._character);
            if (enemyData) {
                enemyData.sprite = this;
                this.updateEnemyInfo(enemyData);
            } else if (this._enemyInfo) {
                this.removeChild(this._enemyInfo);
                this._enemyInfo = null;
            }
        }
    };

    Sprite_Character.prototype.updateEnemyInfo = function(enemyData) {
        if (!this._enemyInfo) {
            this._enemyInfo = new Sprite();
            this._enemyInfo.bitmap = new Bitmap(250, 60);
            this._enemyInfo.y = -60;
            this._enemyInfo.x = -100;
            this.addChild(this._enemyInfo);
        }
        
        var bitmap = this._enemyInfo.bitmap;
        bitmap.clear();
        bitmap.fontSize = 16;
        
        if (enemyData.defeated) {
            bitmap.textColor = "#AAAAAA";
            bitmap.drawText(enemyData.name + " (ПОБЕЖДЕН)", 0, 0, 250, 20, 'center');
        } else {
            bitmap.textColor = "#FFFFFF";
            bitmap.drawText(enemyData.name, 0, 0, 250, 20, 'center');
            bitmap.drawText("HP: " + enemyData.hp + "/" + enemyData.maxHp, 0, 20, 250, 20, 'center');
            bitmap.drawText("Урон: " + enemyData.damage, 0, 40, 250, 20, 'center');
            if (enemyData.parry > 0) {
                bitmap.drawText("Парирование: " + enemyData.parry, 0, 60, 250, 20, 'center');
            }
        }
        
        bitmap.outlineColor = "#000000";
        bitmap.outlineWidth = 4;
    };
})();