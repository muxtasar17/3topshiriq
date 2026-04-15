# Hospital Queue NFT + Vote DApp

Shifoxona navbat jarayonini NFT va on-chain ovoz berish orqali boshqarish loyihasi.

## Nimalar bajarildi
- Smart kontrakt arxitekturasi rejalandi (`docs/ARCHITECTURE.md`).
- Solidity asosiy kontrakt yozildi:
  - `contracts/HospitalQueueNFT.sol`
  - NFT mint (`payable`)
  - Vote (proposal create/update/cancel/vote/execute)
  - Owner-only boshqaruv funksiyalari
- Testlar yozildi: `test/HospitalQueueNFT.test.js`
- Deploy skriptlari yozildi:
  - Local: `npm run deploy:local`
  - Sepolia: `npm run deploy:sepolia`
- Frontend interfeys yaratildi (`ethers` orqali bog'langan):
  - `frontend/index.html`
  - `frontend/app.js`
  - `frontend/style.css`
- UX/Dizayn yaxshilandi:
  - responsiv layout
  - status panel
  - aniq action flow
- Slayd-demo tayyorlandi: `slides/DEMO_SLIDES.md`

## Texnologiyalar
- Hardhat 3
- Solidity `0.8.24`
- OpenZeppelin Contracts
- Viem (deploy/test scriptlar)
- Frontend: Vanilla JS + Ethers v6 (browser ESM)

## O'rnatish
```bash
npm install
```

## Kompilyatsiya
```bash
npm run compile
```

## Testlar
```bash
npm run test
```

## Local demo
```bash
npm run demo:nft
```

## Deploy (local)
```bash
npm run deploy:local
npm run export:frontend
```

## Deploy (Sepolia testnet)
1. `.env.example` fayl asosida `.env` yarating.
2. `SEPOLIA_RPC_URL` va `SEPOLIA_PRIVATE_KEY` ni kiriting.
3. Quyidagini ishga tushiring:

```bash
npm run deploy:sepolia
npm run export:frontend
```

Deploy natijasi `deployments/latest.json` fayliga yoziladi.

## Frontend ishga tushirish
```bash
npm run frontend
```
Brauzer: `http://127.0.0.1:5173`

## Frontenddan foydalanish
1. `Connect Wallet`.
2. `Mint Queue NFT`.
3. `Create Proposal`.
4. `Vote For` yoki `Vote Against`.
5. `Proposal Inspector` orqali natijani ko'rish.

## GitHub
Ushbu loyiha `main` branchga push qilishga tayyor.

## Taqdimot (slides)
`slides/DEMO_SLIDES.md` bo'yicha demo qilinadi:
- muammo
- yechim
- arxitektura
- live flow
- deploy
