# Slide 1 - Loyiha nomi
Hospital Queue NFT + Vote DApp

Maqsad: navbat tizimini NFT va on-chain vote orqali shaffof boshqarish.

---

# Slide 2 - Muammo
- Navbat boshqaruvida markazlashgan ishonch muammosi
- O'zgarishlar bo'yicha foydalanuvchi fikri yo'q
- Raqamli pass yo'qligi sabab tekshiruv qiyin

---

# Slide 3 - Yechim
- `ERC721` asosida Queue Pass NFT
- Mint paytida to'lov `treasury`ga yo'naltiriladi
- NFT holderlar proposal yaratadi va vote beradi
- Owner proposalni deadline'dan so'ng execute qiladi

---

# Slide 4 - Arxitektura
- Smart contract: `contracts/HospitalQueueNFT.sol`
- Deploy: `scripts/deploy-nft.js`
- Frontend: `frontend/index.html`, `frontend/app.js`
- Testlar: `test/HospitalQueueNFT.test.js`

---

# Slide 5 - Asosiy funksiyalar (User)
- Wallet ulash
- Queue NFT mint qilish
- Proposal yaratish
- FOR / AGAINST ovoz berish
- Proposal holatini kuzatish

---

# Slide 6 - Demo oqimi
1. Wallet connect
2. Mint NFT (`mintQueueNFT`)
3. Proposal create
4. Vote
5. Proposal stats va holatni tekshirish

---

# Slide 7 - Testnet deploy
- Tarmoq: Sepolia
- Kerakli env:
  - `SEPOLIA_RPC_URL`
  - `SEPOLIA_PRIVATE_KEY`
- Buyruq:
  - `npm run deploy:sepolia`

---

# Slide 8 - Keyingi bosqich
- IPFS metadata avtomatlashtirish
- Snapshot/DAO integratsiyasi
- Monitoring panel (proposal analytics)
