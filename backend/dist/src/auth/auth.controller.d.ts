import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
        token: string;
        user: {
            username: string;
            fullName: string;
            role: string;
        };
    }>;
    me(req: any): {
        user: any;
    };
}
