import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Mapeamento completo fornecido pelo usuário - URLs corretas para cada time
const TEAM_URLS: Record<string, string> = {
    '1K': 'https://kingsleague.pro/_ipx/s_48x48/kama/production/club/270f780b-6ee6-47bc-8d52-d7e1fcd887bb/76701289.png',
    'ELB': 'https://kingsleague.pro/_ipx/s_48x48/kama/production/team/18782835.png',
    'ULT': 'https://kingsleague.pro/_ipx/s_48x48/kama/production/team/864769870.png',
    'LCA': 'https://kingsleague.pro/_ipx/s_48x48/kama/production/club/1d35c192-c251-46d6-9304-bdb9137523e1/60546229.png',
    'XBU': 'https://kingsleague.pro/_ipx/s_48x48/kama/production/team/436049352.png',
    'RDB': 'https://kingsleague.pro/_ipx/s_48x48/kama/production/team/20601457.png',
    'SKU': 'https://kingsleague.pro/_ipx/s_48x48/kama/production/club/69f7d0eb-769c-4547-b376-b3d829d10843/725050643.png',
    'PIO': 'https://kingsleague.pro/_ipx/s_48x48/kama/production/team/857172902.png',
    'SAI': 'https://kingsleague.pro/_ipx/s_48x48/kama/production/team/315553678.png',
    'JFC': 'https://kingsleague.pro/_ipx/s_48x48/kama/production/team/912938349.png',
    'POR': 'https://kingsleague.pro/_ipx/s_48x48/kama/production/team/196849290.png',
    'TFC': 'https://kingsleague.pro/_ipx/s_48x48/kama/production/club/141bc328-68c3-41bd-9700-f9ae6bade777/640732369.png'
};

// Nomes dos arquivos badge (baseado nos dados do seed TEAMS_ES)
const TEAM_BADGE_FILES: Record<string, string> = {
    '1K': '1k.png',
    'ELB': 'elbarrio.png',
    'JFC': 'jijantes.png',
    'LCA': 'lacapital.png',
    'TFC': 'lostroncos.png',
    'PIO': 'pio.png',
    'POR': 'porcinos.png',
    'RDB': 'rayodebarcelona.png',
    'SAI': 'saiyans.png',
    'SKU': 'skull.png',
    'ULT': 'ultimatemostoles.png',
    'XBU': 'xbuyerteam.png'
};

// Nomes dos times para referência (baseado no TEAMS_ES)
const TEAM_NAMES: Record<string, string> = {
    '1K': '1K FC',
    'ELB': 'El Barrio',
    'JFC': 'Jijantes FC',
    'LCA': 'La Capital CF',
    'TFC': 'Los Troncos FC',
    'PIO': 'PIO FC',
    'POR': 'Porcinos FC',
    'RDB': 'Rayo de Barcelona',
    'SAI': 'Saiyans FC',
    'SKU': 'Skull FC',
    'ULT': 'Ultimate Móstoles',
    'XBU': 'xBuyer Team'
};

async function downloadImage(url: string, filePath: string, teamCode: string): Promise<boolean> {
    try {
        console.log(`📥 ${teamCode} (${TEAM_NAMES[teamCode]}): Baixando...`);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'image/png,image/jpeg,image/*,*/*;q=0.9',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://kingsleague.pro/',
            }
        });

        if (!response.ok) {
            console.log(`❌ ${teamCode}: HTTP ${response.status}`);
            return false;
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Criar diretório se não existir
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(filePath, buffer);
        console.log(`✅ ${teamCode}: ${Math.round(buffer.length / 1024)}KB → ${path.basename(filePath)}`);
        return true;
    } catch (error) {
        console.log(`❌ ${teamCode}: Erro - ${error}`);
        return false;
    }
}

async function downloadAllSpanishTeams() {
    try {
        console.log('🇪🇸 Baixando imagens dos times espanhóis da Kings League...\n');

        // Buscar times espanhóis do banco para verificar
        const spanishTeams = await prisma.team.findMany({
            where: { region: 'ES' },
            orderBy: { code: 'asc' }
        });

        console.log(`📊 Times no banco: ${spanishTeams.length}`);
        console.log(`📊 URLs mapeadas: ${Object.keys(TEAM_URLS).length}\n`);

        const teamsDir = path.join(process.cwd(), 'public', 'img');
        let downloaded = 0;
        let skipped = 0;
        let errors = 0;

        // Baixar cada imagem usando o nome do badgeFile
        for (const [teamCode, url] of Object.entries(TEAM_URLS)) {
            const badgeFileName = TEAM_BADGE_FILES[teamCode];
            const filePath = path.join(teamsDir, badgeFileName);

            // Verificar se já existe
            if (fs.existsSync(filePath)) {
                console.log(`⏭️  ${teamCode}: Já existe (${badgeFileName})`);
                skipped++;
                continue;
            }

            const success = await downloadImage(url, filePath, teamCode);
            if (success) {
                downloaded++;
            } else {
                errors++;
            }

            // Delay para não sobrecarregar o servidor
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log(`\n🎉 Download concluído!`);
        console.log(`✅ Baixadas: ${downloaded}`);
        console.log(`⏭️  Já existiam: ${skipped}`);
        console.log(`❌ Erros: ${errors}`);
        console.log(`📊 Total processado: ${downloaded + skipped + errors}`);

        // Verificar cobertura completa
        console.log(`\n🔍 Verificação final:`);
        for (const team of spanishTeams) {
            const badgeFileName = TEAM_BADGE_FILES[team.code];
            const imagePath = path.join(teamsDir, badgeFileName);
            const exists = fs.existsSync(imagePath);

            if (exists) {
                const size = Math.round(fs.statSync(imagePath).size / 1024);
                console.log(`✅ ${team.code} - ${team.name} → ${badgeFileName} (${size}KB)`);
            } else {
                console.log(`❌ ${team.code} - ${team.name} → ${badgeFileName} (não encontrada)`);
            }
        }

        // Listar todas as imagens espanholas baixadas
        const spanishImages = Object.values(TEAM_BADGE_FILES)
            .filter(fileName => fs.existsSync(path.join(teamsDir, fileName)))
            .sort();

        console.log(`\n📁 Imagens espanholas disponíveis (${spanishImages.length}/12):`);
        spanishImages.forEach(fileName => {
            const filePath = path.join(teamsDir, fileName);
            const size = Math.round(fs.statSync(filePath).size / 1024);
            const teamCode = Object.keys(TEAM_BADGE_FILES).find(code => TEAM_BADGE_FILES[code] === fileName);
            const teamName = teamCode ? TEAM_NAMES[teamCode] : 'Desconhecido';
            console.log(`  - ${fileName} (${size}KB) - ${teamName}`);
        });

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

downloadAllSpanishTeams();