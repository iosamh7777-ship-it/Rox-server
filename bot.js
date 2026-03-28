const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, PermissionFlagsBits } = require('discord.js');
require('dotenv').config();

// Configuration
const TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
    console.error('❌ خطأ: يرجى التأكد من ملء جميع البيانات في ملف .env (BOT_TOKEN, CLIENT_ID, GUILD_ID)');
    process.exit(1);
}

const ROLES = {
    police: '1486744401014423654',
    ems: '1486744444853158089',
    admin: '1486744555555555555' // Add admin role - update this ID if needed
};

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages
    ]
});

// Define Slash Commands
const commands = [
    new SlashCommandBuilder()
        .setName('accept')
        .setDescription('قبول طلب تقديم وإعطاء الرتبة')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('المستخدم المراد قبوله')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('dept')
                .setDescription('القسم (police أو ems أو admin)')
                .setRequired(true)
                .addChoices(
                    { name: 'الشرطة (Police)', value: 'police' },
                    { name: 'الإسعاف (EMS)', value: 'ems' },
                    { name: 'إدارة (Admin)', value: 'admin' }
                ))
].map(command => command.toJSON());

// Register Commands
const rest = new REST({ version: '10' }).setToken(TOKEN);

async function registerCommands() {
    try {
        console.log('⏳ جاري تحديث أوامر البوت (/) ...');
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands },
        );
        console.log('✅ تم تحديث الأوامر بنجاح في السيرفر.');
    } catch (error) {
        console.error('❌ فشل تحديث الأوامر:', error);
    }
}

registerCommands();

// Bot Events
client.once('ready', () => {
    console.log(`🚀 تم تشغيل البوت بنجاح باسم: ${client.user.tag}`);
    console.log('💡 استخدم أمر /accept في الديسكورد للقبول.');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'accept') {
        // التحقق من أن المستخدم لديه صلاحية الإدارة
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '❌ ليس لديك صلاحية استخدام هذا الأمر.', ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const dept = interaction.options.getString('dept');
        const roleId = ROLES[dept];

        await interaction.deferReply();

        try {
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            if (!member) {
                return interaction.editReply({ content: `❌ خطأ: المستخدم غير موجود في هذا السيرفر.` });
            }

            const role = await interaction.guild.roles.fetch(roleId).catch(() => null);
            if (!role) {
                return interaction.editReply({ content: `❌ خطأ: لم يتم العثور على الرتبة (ID: ${roleId}). يرجى التأكد من صحة الـ ID.` });
            }

            // التحقق من رتبة البوت مقارنة بالرتبة المراد إعطاؤها
            const botMember = await interaction.guild.members.fetch(client.user.id);
            if (botMember.roles.highest.position <= role.position) {
                return interaction.editReply({ content: `❌ فشل: رتبة البوت أقل من الرتبة المراد إعطاؤها. يرجى رفع رتبة البوت في قائمة الأدوار.` });
            }

            await member.roles.add(role);
            
            let deptDisplay = '🎖️';
            if (dept === 'police') deptDisplay = 'الشرطة';
            else if (dept === 'ems') deptDisplay = 'الإسعاف';
            else if (dept === 'admin') deptDisplay = 'الإدارة';
            
            await interaction.editReply({
                content: `✅ **تم القبول بنجاح!**\n👤 المستخدم: ${user}\n🎖️ الرتبة: ${role.name}\n📂 القسم: ${deptDisplay}`
            });

        } catch (error) {
            console.error('Error adding role:', error);
            await interaction.editReply({ content: `❌ حدث خطأ غير متوقع أثناء إعطاء الرتبة.` });
        }
    }
});

client.login(TOKEN).catch(err => {
    console.error('❌ فشل تسجيل الدخول للبوت. تأكد من صحة التوكن (TOKEN):', err.message);
});