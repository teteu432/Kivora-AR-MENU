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
  },
  {
    id: 'pizza-calabresa',
    category: 'Pizzas',
    name: 'Pizza de Calabresa',
    shortName: 'Calabresa',
    description:
      'Massa assada, molho de tomate, mussarela, calabresa, cebola roxa e toque de orégano.',
    price: 49.9,
    modelUrl:
      '/models/pizza-calabresa.glb',
    realWidthCm: 32,
    realHeightCm: 3.5,
    emoji: '🍕',
    note: 'Pizza média • 6 fatias',
  },
]
