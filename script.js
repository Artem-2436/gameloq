const canvas = document.getElementById('artCanvas');
const ctx = canvas.getContext('2d', { alpha: false }); // Оптимизация для скорости

let width, height;
let particles = [];
let currentMode = 'starburst'; // starburst, rain, firework

// Настройки производительности
const MAX_PARTICLES = 2000; // Ограничение для мобильных устройств

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}
window.addEventListener('resize', resize);
resize();

// --- КЛАСС ЧАСТИЦЫ ---
class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        
        // Цвета (неоновая палитра)
        const colors = ['#ff00cc', '#00ffff', '#ffffff', '#bd00ff'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        
        this.life = 1.0; // Прозрачность/жизнь
        this.decay = Math.random() * 0.015 + 0.005; // Скорость исчезновения
        
        if (type === 'starburst') {
            // Луч расходится из точки во все стороны
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 8 + 2; // Быстрые лучи
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.size = Math.random() * 2 + 1;
        } 
        else if (type === 'rain') {
            // Падает сверху вниз с небольшим разбросом
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = Math.random() * 5 + 5; // Гравитация
            this.size = Math.random() * 1.5 + 0.5;
            this.decay = 0.008; // Живет дольше
        }
        else if (type === 'firework') {
            // Взрыв снизу вверх, затем гравитация
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 10 + 5;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed - 2; // Импульс вверх
            this.gravity = 0.1;
            this.size = Math.random() * 3 + 1;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;

        // Специфика типов
        if (this.type === 'firework') {
            this.vy += this.gravity; // Гравитация тянет вниз после взрыва
            this.vx *= 0.96; // Сопротивление воздуха
            this.vy *= 0.96;
        } else if (this.type === 'starburst') {
             // Замедление лучей
            this.vx *= 0.95;
            this.vy *= 0.95;
        }
    }

    draw() {
        ctx.globalAlpha = this.life;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.size;
        
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        // Рисуем короткий отрезок вдоль вектора движения (эффект motion blur)
        ctx.lineTo(this.x - this.vx * 2, this.y - this.vy * 2);
        ctx.stroke();
        
        // Точка в начале (яркая сердцевина)
        if (this.life > 0.8) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.x, this.y, 1, 1);
        }
    }
}

// --- СИСТЕМА ЭФФЕКТА "TRAIL" (ШЛЕЙФ) ---
// Вместо полной очистки экрана мы рисуем полупрозрачный черный квадрат.
// Это создает эффект свечения и длинных хвостов у частиц.
function renderLoop() {
    // Эффект затухания предыдущих кадров (Liquid Glass / Neon Trail)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; // Чем меньше цифра, тем длиннее шлейф
    ctx.fillRect(0, 0, width, height);

    // Обновляем и рисуем частицы
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.update();
        p.draw();
        
        // Удаляем мертвые частицы
        if (p.life <= 0 || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
            particles.splice(i, 1);
        }
    }

    requestAnimationFrame(renderLoop);
}

// --- ИНТЕРФЕЙС И УПРАВЛЕНИЕ ---

function setMode(mode) {
    currentMode = mode;
    // Обновляем кнопки
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${mode}`).classList.add('active');
    
    // Очищаем экран при смене режима для резкости
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
}

function spawnParticles(x, y) {
    let count = 0;
    
    if (currentMode === 'starburst') {
        count = 150; // Много лучей сразу
    } else if (currentMode === 'rain') {
        count = 50;  // Дождь
    } else if (currentMode === 'firework') {
        count = 100; // Взрыв
    }

    for (let i = 0; i < count; i++) {
        if (particles.length < MAX_PARTICLES) {
            particles.push(new Particle(x, y, currentMode));
        }
    }
}

// Обработка касаний (Touch)
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    for (let i = 0; i < e.touches.length; i++) {
        spawnParticles(e.touches[i].clientX, e.touches[i].clientY);
    }
}, { passive: false });

// Обработка мыши (Desktop)
canvas.addEventListener('mousedown', (e) => {
    spawnParticles(e.clientX, e.clientY);
});

// Запуск цикла
renderLoop();
