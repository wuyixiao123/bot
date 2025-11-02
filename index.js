const express = require("express");
const http = require("http");
const https = require("https");
const mineflayer = require('mineflayer')
const pvp = require('mineflayer-pvp').plugin
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const armorManager = require('mineflayer-armor-manager')
const mc = require('minecraft-protocol');
const AutoAuth = require('mineflayer-auto-auth');
const app = express();


const keep_alive = require("./keep_alive.js")
// 自 Ping 函数（防止休眠）
function keepAlive() {
  setInterval(() => {
    const https = require('https');
    const url = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;

    https.get(url, (res) => {
      console.log(`自 Ping: ${new Date().toISOString()}`);
    }).on('error', (err) => {
      console.log('自 Ping 错误:', err.message);
    });
  }, 300000); // 每5分钟执行一次
}

// 只在 Replit 环境中启用自 Ping
if (process.env.REPL_SLUG) {
  keepAlive();
}
app.use(express.json());

app.get("/", (_, res) => res.sendFile(__dirname + "/index.html"));
app.listen(process.env.PORT);

setInterval(() => {
  if (process.env.REPLIT_DEV_DOMAIN) {
    https.get(`https://${process.env.REPLIT_DEV_DOMAIN}/`).on('error', () => {});
  }
}, 224000);


// U CAN ONLY EDIT THIS SECTION!!
function createBot() {
  console.log('Attempting to connect to Minecraft server...')
  const bot = mineflayer.createBot({
    host: '2h698.aternos.me',
    version: "1.16.5", // U can replace with 1.16.5 for example, remember to use ', = '1.16.5'
    username: 'MCbot',
    port: 46750,
    plugins: [AutoAuth],
    AutoAuth: 'bot112022',
    connectTimeout: Infinity // 30 second timeout
  })
  /// DONT TOUCH ANYTHING MORE!
  
  bot.on('spawn', () => {
    console.log('Bot successfully connected and spawned!')
  })
  bot.loadPlugin(pvp)
  bot.loadPlugin(armorManager)
  bot.loadPlugin(pathfinder)


  bot.on('playerCollect', (collector, itemDrop) => {
    if (collector !== bot.entity) return

    setTimeout(() => {
      const sword = bot.inventory.items().find(item => item.name.includes('sword'))
      if (sword) bot.equip(sword, 'hand')
    }, 150)
  })

  bot.on('playerCollect', (collector, itemDrop) => {
    if (collector !== bot.entity) return

    setTimeout(() => {
      const shield = bot.inventory.items().find(item => item.name.includes('shield'))
      if (shield) bot.equip(shield, 'off-hand')
    }, 250)
  })

  let guardPos = null

  function guardArea(pos) {
    guardPos = pos.clone()

    if (!bot.pvp.target) {
      moveToGuardPos()
    }
  }

  function stopGuarding() {
    guardPos = null
    bot.pvp.stop()
    bot.pathfinder.setGoal(null)
  }

  function moveToGuardPos() {
    const mcData = require('minecraft-data')(bot.version)
    bot.pathfinder.setMovements(new Movements(bot, mcData))
    bot.pathfinder.setGoal(new goals.GoalBlock(guardPos.x, guardPos.y, guardPos.z))
  }

  bot.on('stoppedAttacking', () => {
    if (guardPos) {
      moveToGuardPos()
    }
  })

  bot.on('physicTick', () => {
    if (bot.pvp.target) return
    if (bot.pathfinder.isMoving()) return

    const entity = bot.nearestEntity()
    if (entity) bot.lookAt(entity.position.offset(0, entity.height, 0))
  })
  bot.on('physicTick', () => {
    if (!guardPos) return
    const filter = e => e.type === 'mob' && e.position.distanceTo(bot.entity.position) < 16 &&
      e.mobType !== 'Armor Stand'
    const entity = bot.nearestEntity(filter)
    if (entity) {
      bot.pvp.attack(entity)
    }
  })
  bot.on('chat', (username, message) => {
    if (message === 'guard') {
      const player = bot.players[username]

      if (player && player.entity) {
        bot.chat('I will guard this area!')
        guardArea(player.entity.position)
      }

    }
    if (message === 'stop') {
      bot.chat('I will stop!')
      stopGuarding()
    }
  })

  bot.on('kicked', (reason) => {
    console.log('Bot was kicked:', reason)
  })
  
  bot.on('error', (err) => {
    console.error('Bot error:', err.message)
    if (err.code === 'ECONNRESET') {
      console.log('Connection was reset. The server might be offline or unreachable.')
    }
  })
  
  bot.on('end', () => {
    console.log('Connection ended. Reconnecting in 5 seconds...')
    setTimeout(createBot, 5000) // Wait 5 seconds before reconnecting
  })
}

createBot()

//// Rembember to sucribe to my channels!
/// www.youtube.com/c/JinMoriYT
///www.youtube.com/channel/UC1SR0lQSDfdaSMhmUiaMitg