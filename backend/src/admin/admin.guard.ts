import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AdminGuard extends AuthGuard('jwt') implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First, let the JwtAuthGuard handle authentication
    const authenticated = await super.canActivate(context);

    if (!authenticated) {
      return false; // Not authenticated, so not authorized
    }

    // If authenticated, check the user's isAdmin property
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return user && user.isAdmin; // Only allow if user exists and isAdmin is true
  }
}
