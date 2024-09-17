import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '#/user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'yourSecretKey', // Ubah sesuai kebutuhan
    });
  }

  async validate(payload: any) {
    // Lakukan pengecekan di database apakah user masih valid
    const user = await this.userService.getUserById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan');
    }

    // Kembalikan user yang valid
    return { id: user.id, email: user.email, role_name: user.role.role_name };
  }
}