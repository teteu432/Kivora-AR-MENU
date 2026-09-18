export type Product3D = {
  id: string
  name: string
  description: string
  price: number
  modelUrl: string
  realWidthCm: number
  realHeightCm: number
}

export const xBurger: Product3D = {
  id: 'x-burguer-especial',
  name: 'X-Burguer Especial',
  description:
    'Hambúrguer artesanal com queijo, salada e molho especial.',
  price: 29.9,
  modelUrl:
    'https://cdn.jsdelivr.net/gh/mindset-code/burger-house-3d@c2bddc597efe4870326c843a6e056727752fc261/public/hamburger__food_big-hamburger.glb',

  // MEDIDAS REAIS DO PRODUTO.
  // Quando tivermos o lanche real, basta trocar estes dois valores.
  realWidthCm: 13,
  realHeightCm: 8,
}
