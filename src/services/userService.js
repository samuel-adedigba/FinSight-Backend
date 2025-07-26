// src/services/userService.js
import { prisma } from '../db/prisma.js';
import { generateBankAccountId } from '../lib/randomBankCode.js';
import { publishEvent } from '../messaging/redisPublisher.js';
import { createUserBankAccount } from './accountService.js';

export async function createUser({name, email, password, role, phone}) {

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password,
      role, phone
    },
  });
    const accountId = generateBankAccountId();
  await createUserBankAccount({
    id:              accountId,
    userId:          user.id,
    bankCode:        101,                // your FinSight bank code
    bankName:        'FinSight Bank',
    accountNumber:   phone,             // use phone as account number
    currency:        'NGN',             // default currency
    balance:         0
  });

  await publishEvent('user-events', {
    type: 'USER_CREATED',
    userId: user.id,
  });

  return user;
}

export async function getUserById(id) {
  return prisma.user.findUnique({ where: { id } });
}


export function getUserByEmail(email) {
  if (!email || typeof email !== 'string') {
    throw new Error('A valid email string is required');
  }
  return prisma.user.findUnique({ where: { email } });
}
export async function updateUserDetails({id, email,name}) {
  const user = await prisma.user.update({
    where: { id },
    data: {
      name,
      email,
    }
  });
  await publishEvent('user-events', {
    type: 'USER_UPDATED',
    userId: id,
  })
  return user;
}

export async function getAllUsers() {
  return prisma.user.findMany();
}
export async function deleteUser(id) {
  const user = await prisma.user.delete({
    where: { id },
  });
  await publishEvent('user-events', {
    type: 'USER_DELETED',
    userId: id,
  });
  return user;
};

export async function updateUserIdentity({ id, bvn, nin }) {
  const user = await prisma.user.update({
    where: { id },
    data: { bvn, nin }
  });
  await publishEvent('USER_UPDATED', { userId: id });
  return user;
}