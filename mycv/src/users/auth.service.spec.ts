import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { UsersService } from './users.service';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    const users: User[] = [];
    fakeUsersService = {
      find: (email: string) => {
        const filteredUsers = users.filter((user) => user.email === email);
        return Promise.resolve(filteredUsers);
      },
      create: (email: string, password: string) => {
        const user = {
          id: Math.floor(Math.random() * 999999),
          email,
          password,
        } as User;
        users.push(user);
        return Promise.resolve(user);
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('creates a new user with a salted and hashed password', async () => {
    const user = await service.signup('abcd@gmail.com', '1234');

    expect(user.password).not.toEqual('1234');
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('throws an error if user signs up with email that is in use', async (done) => {
    await service.signup('abcd@gmail.com', '1234');
    try {
      await service.signup('abcd@gmail.com', '1234');
    } catch (err) {
      done();
    }
  });

  it('throws if signin is called with an unused email', async (done) => {
    try {
      await service.signin('abcd@gmail.com', 'password');
    } catch (err) {
      done();
    }
  });

  it('throws if an invalid password is provided', async (done) => {
    await service.signup('abcd@gmail.com', 'password1');

    try {
      await service.signin('abcd@gmail.com', 'password');
    } catch (err) {
      done();
    }
  });

  it('returns a user if correct password is provided', async () => {
    await service.signup('abcd@gmail.com', 'password');

    const user = await service.signin('abcd@gmail.com', 'password');
    expect(user).toBeDefined();
  });
});
