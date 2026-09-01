import { VECTOR_GALLERY, VectorItem, CLOUDINARY_VECTOR_MAP } from './vectorGallery';

export const CLOUDINARY_HOSTED_ASSETS = {
  tshirt: CLOUDINARY_VECTOR_MAP.normal,
  jeans: CLOUDINARY_VECTOR_MAP.normal,
  formal_shirt: CLOUDINARY_VECTOR_MAP.suits,
  hoodie: CLOUDINARY_VECTOR_MAP.normal,
  sweater: CLOUDINARY_VECTOR_MAP.normal,
  suit_blazer: CLOUDINARY_VECTOR_MAP.suits,
  winter_jacket: CLOUDINARY_VECTOR_MAP.leather,
  leather_jacket: CLOUDINARY_VECTOR_MAP.leather,
  trousers_pants: CLOUDINARY_VECTOR_MAP.normal,
  shorts: CLOUDINARY_VECTOR_MAP.normal,
  dress_gown: CLOUDINARY_VECTOR_MAP.wedding_dress,
  wedding_dress: CLOUDINARY_VECTOR_MAP.wedding_dress,
  saree: CLOUDINARY_VECTOR_MAP.wedding_dress,
  kurta: CLOUDINARY_VECTOR_MAP.suits,
  sneakers: CLOUDINARY_VECTOR_MAP.shoes,
  bedsheet_set: CLOUDINARY_VECTOR_MAP.bedding,
  blanket_quilt: CLOUDINARY_VECTOR_MAP.blanket,
  curtains_drapes: CLOUDINARY_VECTOR_MAP.curtains,
  backpack: CLOUDINARY_VECTOR_MAP.bag,
  carpet_rug: CLOUDINARY_VECTOR_MAP.rugs,
  dryclean_hanger: CLOUDINARY_VECTOR_MAP.dryClean,
  washing_machine: CLOUDINARY_VECTOR_MAP.easyWash,
};

export const getCategoryIllustrationUrl = (name?: string, customImage?: string): string => {
  if (customImage && typeof customImage === 'string') {
    const trimmed = customImage.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
      return trimmed;
    }
  }

  const n = (name || '').toLowerCase().trim();

  if (n.includes('dry') || n.includes('premium')) return CLOUDINARY_HOSTED_ASSETS.suit_blazer;
  if (n.includes('leather')) return CLOUDINARY_HOSTED_ASSETS.leather_jacket;
  if (n.includes('winter') || n.includes('jacket') || n.includes('coat')) return CLOUDINARY_HOSTED_ASSETS.winter_jacket;
  if (n.includes('sweater') || n.includes('cardigan') || n.includes('hoodie')) return CLOUDINARY_HOSTED_ASSETS.sweater;
  if (n.includes('bed') || n.includes('sheet') || n.includes('linen')) return CLOUDINARY_HOSTED_ASSETS.bedsheet_set;
  if (n.includes('curtain') || n.includes('drape')) return CLOUDINARY_HOSTED_ASSETS.curtains_drapes;
  if (n.includes('suit') || n.includes('formal') || n.includes('blazer') || n.includes('interview')) return CLOUDINARY_HOSTED_ASSETS.suit_blazer;
  if (n.includes('blanket') || n.includes('quilt')) return CLOUDINARY_HOSTED_ASSETS.blanket_quilt;
  if (n.includes('wedding') || n.includes('gown')) return CLOUDINARY_HOSTED_ASSETS.wedding_dress;
  if (n.includes('saree') || n.includes('ethnic') || n.includes('kurta')) return CLOUDINARY_HOSTED_ASSETS.saree;
  if (n.includes('shoe') || n.includes('sneaker') || n.includes('footwear')) return CLOUDINARY_HOSTED_ASSETS.sneakers;
  if (n.includes('rug') || n.includes('carpet')) return CLOUDINARY_HOSTED_ASSETS.carpet_rug;
  if (n.includes('bag') || n.includes('backpack')) return CLOUDINARY_HOSTED_ASSETS.backpack;
  if (n.includes('iron') || n.includes('press')) return CLOUDINARY_HOSTED_ASSETS.formal_shirt;

  return CLOUDINARY_HOSTED_ASSETS.tshirt;
};

export const getItemIllustrationUrl = (itemName?: string, categoryName?: string, customImage?: string): string => {
  if (customImage && typeof customImage === 'string') {
    const trimmed = customImage.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
      return trimmed;
    }
  }

  const iname = (itemName || '').toLowerCase().trim();

  if (iname.includes('t-shirt') || iname.includes('tshirt') || iname.includes('top')) return CLOUDINARY_HOSTED_ASSETS.tshirt;
  if (iname.includes('jean') || iname.includes('denim')) return CLOUDINARY_HOSTED_ASSETS.jeans;
  if (iname.includes('formal shirt') || iname.includes('button down') || iname.includes('shirt')) return CLOUDINARY_HOSTED_ASSETS.formal_shirt;
  if (iname.includes('hoodie') || iname.includes('sweatshirt')) return CLOUDINARY_HOSTED_ASSETS.hoodie;
  if (iname.includes('sweater') || iname.includes('cardigan') || iname.includes('wool')) return CLOUDINARY_HOSTED_ASSETS.sweater;
  if (iname.includes('suit') || iname.includes('tuxedo') || iname.includes('blazer') || iname.includes('two-piece')) return CLOUDINARY_HOSTED_ASSETS.suit_blazer;
  if (iname.includes('leather')) return CLOUDINARY_HOSTED_ASSETS.leather_jacket;
  if (iname.includes('jacket') || iname.includes('coat') || iname.includes('winter') || iname.includes('puffer')) return CLOUDINARY_HOSTED_ASSETS.winter_jacket;
  if (iname.includes('trouser') || iname.includes('pant') || iname.includes('chino')) return CLOUDINARY_HOSTED_ASSETS.trousers_pants;
  if (iname.includes('short')) return CLOUDINARY_HOSTED_ASSETS.shorts;
  if (iname.includes('dress') || iname.includes('gown') || iname.includes('frock')) return CLOUDINARY_HOSTED_ASSETS.dress_gown;
  if (iname.includes('wedding') || iname.includes('bridal') || iname.includes('lehenga')) return CLOUDINARY_HOSTED_ASSETS.wedding_dress;
  if (iname.includes('saree') || iname.includes('sari')) return CLOUDINARY_HOSTED_ASSETS.saree;
  if (iname.includes('kurta') || iname.includes('kurti') || iname.includes('sherwani')) return CLOUDINARY_HOSTED_ASSETS.kurta;
  if (iname.includes('sock')) return CLOUDINARY_HOSTED_ASSETS.tshirt;
  if (iname.includes('sneaker') || iname.includes('sport shoe') || iname.includes('shoe')) return CLOUDINARY_HOSTED_ASSETS.sneakers;
  if (iname.includes('bedsheet') || iname.includes('linen') || iname.includes('bed cover') || iname.includes('pillow')) return CLOUDINARY_HOSTED_ASSETS.bedsheet_set;
  if (iname.includes('blanket') || iname.includes('quilt') || iname.includes('duvet') || iname.includes('comforter')) return CLOUDINARY_HOSTED_ASSETS.blanket_quilt;
  if (iname.includes('curtain') || iname.includes('drape')) return CLOUDINARY_HOSTED_ASSETS.curtains_drapes;
  if (iname.includes('towel') || iname.includes('bath')) return CLOUDINARY_HOSTED_ASSETS.bedsheet_set;
  if (iname.includes('backpack') || iname.includes('school bag') || iname.includes('bag')) return CLOUDINARY_HOSTED_ASSETS.backpack;
  if (iname.includes('rug') || iname.includes('carpet') || iname.includes('mat')) return CLOUDINARY_HOSTED_ASSETS.carpet_rug;
  if (iname.includes('dryclean') || iname.includes('dry clean')) return CLOUDINARY_HOSTED_ASSETS.dryclean_hanger;
  if (iname.includes('iron') || iname.includes('press') || iname.includes('steam')) return CLOUDINARY_HOSTED_ASSETS.formal_shirt;
  if (iname.includes('per kg') || iname.includes('regular wash') || iname.includes('wash')) return CLOUDINARY_HOSTED_ASSETS.washing_machine;

  return getCategoryIllustrationUrl(categoryName, customImage);
};

export const getCategoryIllustration = (name?: string, customImage?: string): { uri: string } => ({
  uri: getCategoryIllustrationUrl(name, customImage),
});

export const getItemIllustration = (itemName?: string, categoryName?: string, customImage?: string): { uri: string } => ({
  uri: getItemIllustrationUrl(itemName, categoryName, customImage),
});
