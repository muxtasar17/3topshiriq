# Hospital Queue NFT - Smart Contract Arxitekturasi

## 1. Maqsad
Bu loyiha shifoxona navbat tokenizatsiyasini NFT orqali boshqaradi va navbat siyosati bo'yicha jamoaviy ovoz berishni (`vote`) taqdim etadi.

## 2. Asosiy modullar
- `HospitalQueueNFT.sol`:
  - `ERC721URIStorage`: navbat pass NFT yaratish.
  - `Ownable`: admin funksiyalarni cheklash.
  - `ReentrancyGuard`: to'lov operatsiyalarini himoyalash.
- `scripts/deploy-nft.js`: deploy va deploy metadata saqlash.
- `frontend/`: wallet ulanishi, mint, proposal yaratish, vote.

## 3. Smart-kontrakt dizayni
- Mint modeli:
  - `mintQueueNFT(tokenURI)` funksiyasi `payable`.
  - `mintPrice` asosida to'lov tekshiriladi.
  - To'lov `treasury` manzilga o'tkaziladi.
- Governance modeli:
  - NFT holderlar `createProposal(...)` orqali taklif yaratadi.
  - `vote(proposalId, support)` bilan ovoz beradi.
  - Har proposal uchun har adres bir marta ovoz bera oladi (`hasVoted` mapping).
  - `executeProposal` faqat owner tomonidan, deadline tugagandan keyin.

## 4. Data modeli
- `mapping(address => uint256) userBalances`: foydalanuvchi to'lovlari statistikasi.
- `mapping(address => uint256) userMintCount`: foydalanuvchi mint soni.
- `mapping(uint256 => Proposal) proposals`: proposal ma'lumotlari.
- `mapping(uint256 => mapping(address => bool)) hasVoted`: kim qaysi proposalga ovoz bergani.

## 5. Xavfsizlik va cheklovlar
- `require` tekshiruvlari:
  - noto'g'ri treasury manzil,
  - yetarli bo'lmagan mint to'lovi,
  - NFT bo'lmagan foydalanuvchi vote/create qilishi,
  - bir proposalga qayta vote.
- `nonReentrant`:
  - mint va owner withdraw funksiyalarida reentrancy hujumidan himoya.

## 6. Deploy strategiyasi
- Tarmoq:
  - `hardhatMainnet` (lokal simulatsiya),
  - `sepolia` (testnet).
- Config variable:
  - `SEPOLIA_RPC_URL`,
  - `SEPOLIA_PRIVATE_KEY`.
- Deploy natijasi: `deployments/latest.json`.

## 7. Frontend qatlam
- Texnologiya: vanilla JS + `ethers v6` (browser ESM).
- Asosiy flow:
  - Wallet connect,
  - contract state load (`mintPrice`, `proposalCount`),
  - NFT mint,
  - proposal create,
  - vote va proposal inspector.

## 8. Kengaytirish yo'nalishlari
- Vote weightni stake yoki NFT count bo'yicha differensial qilish.
- Proposal ijrosida real biznes action triggerlari (off-chain backend integratsiyasi).
- Multi-role access (admin, doctor, operator) qo'shish.
