let notificationCount = 0;
const proxyUrl = 'https://cors-anywhere.herokuapp.com/'; // Proxy para CORS

function createAndShowNotification(message) {
    return new Promise((resolve) => {
        const notification = document.createElement("div");
        notification.id = `notification-${notificationCount}`; 
        notification.className = "notification";
        notification.style.bottom = `${20 + notificationCount * 70}px`; 
        notification.style.right = "20px"; 
        notification.innerHTML = `
            <div class="notification-content">
                <p align="center">${message}</p>
                <div class="progress-bar"><div></div></div>
            </div>
        `;
        document.body.appendChild(notification);
        notificationCount++;

        setTimeout(() => notification.style.right = "20px", 10);
        setTimeout(() => closeNotification(notification, resolve), 3000);
    });
}

function closeNotification(notification, resolve) {
    notification.style.right = "-300px";
    setTimeout(() => {
        notification.style.display = "none";
        notificationCount--; 
        resolve(); 
    }, 500);
}

// Função para criar um atraso
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchLessons(ra, password) {
    const encodedRa = encodeURIComponent(ra);
    const encodedPassword = encodeURIComponent(password);
    
    try {
        const response = await fetch(`${proxyUrl}https://cmsp-cheeto-v2.vercel.app/getinfo?ra=${encodedRa}&password=${encodedPassword}`);
        if (!response.ok) throw new Error('Erro ao logar na conta<br>Tente ativar a proxy!');

        const data = await response.json();
        if (!data.x_auth_key || !data.room_code) throw new Error('Dados inválidos retornados.');

        return data;
    } catch (error) {
        await createAndShowNotification(error.message);
        return null;
    }
}

async function handleLessons(lessons, x_auth_key, room_code) {
    for (const lesson of lessons) {
        const titleUpper = lesson.title.toUpperCase();
        if (titleUpper.includes("PROVA PAULISTA") || titleUpper.includes("SARESP") || titleUpper.includes("RECUPERAÇÃO")) {
            await createAndShowNotification(`Ignorando: ${lesson.title}`);
            continue; 
        }
        
        console.log(`Fazendo: ${lesson.title}`);
        
        const response = await fetch(`${proxyUrl}https://cmsp-cheeto-v2.vercel.app/dolesson?x_auth_key=${x_auth_key}&room_code=${room_code}&lesson_id=${lesson.id}`);
        if (!response.ok) {
            await createAndShowNotification(`Erro ao fazer a atividade ${lesson.title}. Tente novamente.`);
        }
    }

    // Notificação ao concluir todas as tarefas
    await createAndShowNotification("Todas as tarefas foram concluídas!");
}

async function fazerLicoes(ra, password) {
    if (!ra || !password) {
        alert(' \nPor favor, forneça os dados para acessar o CMSP\n ');
        return;
    }

    await createAndShowNotification("Puxando informações...");
    
    const userData = await fetchLessons(ra, password);
    if (!userData) return;

    const { x_auth_key, room_code } = userData;

    const lessonsResponse = await Promise.all([
        fetch(`${proxyUrl}https://cmsp-cheeto-v2.vercel.app/getlesson_normal?x_auth_key=${x_auth_key}&room_code=${room_code}`),
        fetch(`${proxyUrl}https://cmsp-cheeto-v2.vercel.app/getlesson_expired?x_auth_key=${x_auth_key}&room_code=${room_code}`)
    ]);

    const lessonsData = await Promise.all(lessonsResponse.map(res => res.text()));
    const allLessons = lessonsData.flatMap((lesson) => lesson === '[]' ? [] : JSON.parse(lesson));
    
    await createAndShowNotification("Tarefas carregadas com sucesso!");
    await handleLessons(allLessons, x_auth_key, room_code);
}

// Evento do botão
document.getElementById('submit-btn').onclick = function() {
    const ra = document.getElementById('name').value;
    const password = document.getElementById('password').value;
    fazerLicoes(ra, password);
};

// Evento do botão de créditos
document.getElementById('credits-btn').onclick = function() {
    document.getElementById('credits-modal').style.display = 'flex';
};

// Evento de fechar o modal de créditos
document.getElementById('close-modal').onclick = function() {
    document.getElementById('credits-modal').style.display = 'none';
};

// Evento do botão Ativar Proxy
document.getElementById('proxy-btn').onclick = function() {
    window.open('https://cors-anywhere.herokuapp.com/corsdemo', '_blank');
};

// Mostrar o modal de aviso ao carregar a página
window.onload = () => {
    const lastShown = localStorage.getItem('lastInfoModal');
    const now = Date.now();

    // Verifica se o aviso foi mostrado nas últimas 12 horas (43200000 ms)
    if (!lastShown || now - lastShown > 43200000) {
        document.getElementById('info-modal').style.display = 'flex';
        localStorage.setItem('lastInfoModal', now); // Atualiza o timestamp
    }
};

// Evento de fechar o modal de aviso
document.getElementById('close-info-modal').onclick = function() {
    document.getElementById('info-modal').style.display = 'none';
};
