export type Product3D = {
  id: string
  category: string
  name: string
  shortName: string
  description: string
  price: number
  modelUrl: string
  realWidthCm: number
  realHeightCm: number
  emoji: string
  note: string
  /**
   * true somente quando o próprio GLB já está exportado em escala física real (metros).
   * Isso permite usar Scene Viewer sem perder a medida do produto.
   */
  nativeScaleReady: boolean
  /**
   * Correção visual aplicada ao modelo no navegador/WebXR.
   * Mantém a medida exibida ao usuário (ex.: 13 cm), mas compensa GLBs
   * cuja unidade/origem não representa corretamente o tamanho físico.
   */
  scaleCalibration: number
}

export const products: Product3D[] = [
  {
    id: 'x-burguer-especial',
    category: 'Hambúrgueres',
    name: 'X-Burguer Especial',
    shortName: 'X-Burguer',
    description:
      'Pão macio, hambúrguer artesanal, queijo derretido, salada fresca e molho especial da casa.',
    price: 29.9,
    modelUrl:
      'https://cdn.jsdelivr.net/gh/mindset-code/burger-house-3d@c2bddc597efe4870326c843a6e056727752fc261/public/hamburger__food_big-hamburger.glb',
    realWidthCm: 13,
    realHeightCm: 8,
    emoji: '🍔',
    note: 'Tamanho individual',
    // O modelo remoto é escalado no navegador, mas não está gravado fisicamente em 13 cm.
    // Por isso evitamos Scene Viewer neste item para não abrir com escala incorreta no Android.
    nativeScaleReady: false,
    // Calibração obtida a partir do teste real em mesa: a versão anterior
    // aparentava cerca de 60% do tamanho esperado.
    scaleCalibration: 1.65,
  },
  {
    id: 'pizza-calabresa',
    category: 'Pizzas',
    name: 'Pizza de Calabresa',
    shortName: 'Calabresa',
    description:
      'Massa assada, molho de tomate, mussarela, calabresa, cebola roxa e toque de orégano.',
    price: 49.9,
    modelUrl: '/models/pizza-calabresa.glb',
    realWidthCm: 32,
    realHeightCm: 3.5,
    emoji: '🍕',
    note: 'Pizza média • 6 fatias',
    // Conferido: o GLB mede aproximadamente 0,32 m x 0,03475 m x 0,32 m.
    nativeScaleReady: true,
    // O GLB da pizza já está em aproximadamente 32 cm no próprio arquivo.
    scaleCalibration: 1,
  },
]
