# 🔥 Discord XO Bot: สนามรบ Tic-Tac-Toe สุดเดือด! 🔥

ยินดีต้อนรับสู่ **Discord XO Bot** Tic-Tac-Toe สุดคลาสสิก!

สร้างโดย **Satyr**

---

## 🛡️ ฟีเจอร์
- **PvE: ปะทะ Bot อัจฉริยะ**  
- **PvP: ศึกชิงชัยกับเพื่อน** - เชิญเพื่อนเข้าสู่สนามรบด้วยคำสั่ง `/xo invite` และวัดฝีมือในโหมด 2/3 รอบ!  
- **Interactive Buttons** - ควบคุมเกมด้วยปุ่ม Discord ที่ใช้งานง่าย เลือกตำแหน่งและยกเลิกเกมได้ในคลิกเดียว!  
- **Round-Based System** - ต่อสู้ในรอบสูงสุด 3 รอบ ตัดสินผู้ชนะ  
- **Cancel & Restart** - ยกเลิกเกมเมื่อไหร่ก็ได้ แล้วรีเซ็ตสนามรบเพื่อเริ่มใหม่ทันที!

---

## 🛠️ Tools & เทคโนโลยีที่ใช้
- **Node.js** - สำหรับการรันโค้ด JavaScript  
- **Discord.js (v14)** - ไลบรารีหลักสำหรับเชื่อมต่อและควบคุม Discord API  
- **dotenv** - จัดการตัวแปรสภาพแวดล้อมอย่างปลอดภัย (เช่น `BOT_TOKEN`)  
- **Git & GitHub** - ควบคุมเวอร์ชันและแชร์โค้ด  

---

## ⚙️ การติดตั้งและรันบอท

### 1. เตรียมความพร้อม
- **ติดตั้ง Node.js**: ดาวน์โหลดและติดตั้ง [Node.js](https://nodejs.org/) (v16 ขึ้นไป)  
- **สร้าง Discord Bot**:  
  1. ไปที่ [Discord Developer Portal](https://discord.com/developers/applications)  
  2. สร้างแอปพลิเคชันใหม่ และเพิ่มบอท  
  3. คัดลอก `BOT_TOKEN` และ `CLIENT_ID`  
  4. เชิญบอทเข้าสู่เซิร์ฟเวอร์ของคุณด้วยลิงก์ที่สร้างจาก OAuth2  

### 2. Clone และติดตั้ง Dependencies
```bash
git clone https://github.com/your-username/discord-xo-bot.git
cd discord-xo-bot
npm install
```

### 3. ตั้งค่า Environment Variables
สร้างไฟล์ `.env` ในโฟลเดอร์โปรเจกต์และเพิ่ม:  
```
BOT_TOKEN=your-bot-token-here
CLIENT_ID=your-client-id-here
```

### 4. รันบอท
```bash
node index.js
```
หรือใช้ **PM2** เพื่อรันแบบต่อเนื่อง:  
```bash
npm install -g pm2
pm2 start index.js --name "discord-xo-bot"
```

---

## 🏆 วิธีเล่น
1. ใช้ `/xo create-room` เพื่อสร้างสนามรบ  
2. กดปุ่ม **เริ่มเกม** เพื่อปะทะกับ Bot (PvE) หรือเชิญเพื่อนด้วย `/xo invite` เพื่อ PvP  
3. คลิกปุ่มตัวเลข (1-9) เพื่อวาง **❌** หรือ **⭕** บนกระดาน  
4. ชนะ 2 จาก 3 รอบเพื่อครองชัยในโหมด PvP หรือล้ม Bot ให้ได้!  
5. กด **ยกเลิกการเล่น** เพื่อรีเซ็ตสนามรบและเริ่มใหม่  

---

## ⚠️ ข้อควรระวัง
- อย่าปล่อยให้ `BOT_TOKEN` หลุดสู่สาธารณะ! เพิ่ม `.env` ใน `.gitignore`  
- ตรวจสอบ logs หากบอทหยุดทำงาน  

---

## 🤖 เกี่ยวกับผู้พัฒนา
สร้างโดย **Satyr**

---

## 📜 License
[MIT License](LICENSE) - ใช้ แก้ไข แชร์ ได้ตามใจ แต่อย่าลืมให้เครดิต!

---

🔥 **พร้อมหรือยัง? เข้าสู่สนามรบและครองชัยใน Tic-Tac-Toe!** 🔥