import { Body, Controller, Get, HttpStatus, Param, Post } from '@nestjs/common';
import { UserService } from './users.service';
import { User } from './entities/user.entity';
import { ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RegisterUserDto } from './dtos/RegiserUserDto';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/:id')
  @ApiParam({ name: 'id', description: 'The ID of the user' })
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiOkResponse({ type: User, description: 'The user has been successfully returned.' })
  async findUserById(@Param('id') id: string): Promise<User> {
      return await this.userService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User successfully registered.' })
  async register(@Body() registerUserDto: RegisterUserDto) {
      return await this.userService.register(registerUserDto.email, registerUserDto.password);
  }

  //get all users
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiOkResponse({ type: [User], description: 'All users have been successfully returned.' })
  async findAllUsers(): Promise<User[]> {
      return await this.userService.findAll();
  }
}
