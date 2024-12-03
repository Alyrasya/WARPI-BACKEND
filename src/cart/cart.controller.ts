import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { User } from '#/user/entities/user.entity';
import { Cart } from './entities/cart.entity';
import { JwtAuthGuard } from '#/auth/jwt-auth.guard';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @UseGuards(JwtAuthGuard)
  @Post('add')
  async addToCart(
      @Body() addToCartDto: AddToCartDto
  ): Promise<{ message: string; cart: Cart }> {
      const cart = await this.cartService.addToCart(addToCartDto); 
      return { message: 'Product added to cart successfully', cart };
  }

  @Delete('/deleteProduct')
async deleteProductFromCart(
    @Req() req,
    @Body() { productId }: { productId: string },
) {
    const userId = req.user.id; // Dari token login
    return this.cartService.deleteProductFromCart(userId, productId);
}

@Patch('/edit-quantity')
async editProductQuantity(
    @Req() req,
    @Body() { productId, newQuantity }: { productId: string; newQuantity: number },
) {
    const userId = req.user.id; // Dari token login
    return this.cartService.editProductQuantityInCart(userId, productId, newQuantity);
}

@Get('user/:userId')
async getAllCartsByUserId(@Param('userId') userId: string): Promise<Cart[]> {
    return this.cartService.getAllCartsByUserId(userId);
}



  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cartService.findOne(+id);
  }

}
function CurrentUser(): (target: CartController, propertyKey: "addToCart", parameterIndex: 0) => void {
  throw new Error('Function not implemented.');
}

