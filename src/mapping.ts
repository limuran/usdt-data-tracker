import { Transfer as TransferEvent } from "../generated/USDTContract/ERC20"
import { Transfer, Token, User, DailyStats } from "../generated/schema"
import { BigInt, Address } from "@graphprotocol/graph-ts"
import { ERC20 } from '../generated/USDTContract/ERC20'

// 处理转账事件
export function handleTransfer(event: TransferEvent): void {
  // 获取或创建代币实体
  let token = getOrCreateToken(event.address)
  
  // 创建转账记录
  let transfer = new Transfer(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  )
  
  transfer.token = token.id
  transfer.from = getOrCreateUser(event.params.from).id
  transfer.to = getOrCreateUser(event.params.to).id
  transfer.value = event.params.value
  transfer.blockNumber = event.block.number
  transfer.blockHash = event.block.hash
  transfer.timestamp = event.block.timestamp
  transfer.transactionHash = event.transaction.hash
  
  // 判断是否为大额转账 (>$10,000 等值)
  transfer.isLargeTransfer = event.params.value.gt(BigInt.fromI32(10000).times(BigInt.fromI32(10).pow(18)))
  
  // 更新统计
  updateDailyStats(event.block.timestamp, token, event.params.value)
  updateUserStats(event.params.from, event.params.to, event.params.value, event.block.timestamp)
  
  transfer.save()
}

// 获取或创建代币
function getOrCreateToken(address: Address): Token {
  let token = Token.load(address.toHex())
  
  if (!token) {
    token = new Token(address.toHex())
    
    // 尝试调用合约获取基础信息
    let contract = ERC20.bind(address)
    let nameCall = contract.try_name()
    token.name = nameCall.reverted ? "Unknown" : nameCall.value

    let symbolCall = contract.try_symbol()
    token.symbol = symbolCall.reverted ? "UNK" : symbolCall.value

    let decimalsCall = contract.try_decimals()
    token.decimals = decimalsCall.reverted ? 18 : decimalsCall.value
    token.transferCount = BigInt.fromI32(0)
    token.totalVolume = BigInt.fromI32(0)
    token.holderCount = BigInt.fromI32(0)
    
    token.save()
  }
  
  return token
}

// 获取或创建用户
function getOrCreateUser(address: Address): User {
  let user = User.load(address.toHex())
  
  if (!user) {
    user = new User(address.toHex())
    user.tokens = []
    user.totalSent = BigInt.fromI32(0)
    user.totalReceived = BigInt.fromI32(0)
    user.transactionCount = BigInt.fromI32(0)
    user.isWhale = false
    user.isContract = false  // 可以通过代码大小判断
    
    user.save()
  }
  
  return user
}

// 更新每日统计
function updateDailyStats(timestamp: BigInt, token: Token, volume: BigInt): void {
  let date = new Date(timestamp.toI64() * 1000)
  let dayId = date.toISOString().split('T')[0] + '-' + token.id
  
  let stats = DailyStats.load(dayId)
  if (!stats) {
    stats = new DailyStats(dayId)
    stats.date = date.toISOString().split('T')[0]
    stats.token = token.id
    stats.transferCount = BigInt.fromI32(0)
    stats.volume = BigInt.fromI32(0)
    stats.activeUsers = BigInt.fromI32(0)
    stats.newUsers = BigInt.fromI32(0)
  }
  
  stats.transferCount = stats.transferCount.plus(BigInt.fromI32(1))
  stats.volume = stats.volume.plus(volume)
  stats.save()
}

// 更新用户统计
function updateUserStats(from: Address, to: Address, value: BigInt, timestamp: BigInt): void {
  let fromUser = getOrCreateUser(from)
  let toUser = getOrCreateUser(to)
  
  // 更新发送方
  fromUser.totalSent = fromUser.totalSent.plus(value)
  fromUser.transactionCount = fromUser.transactionCount.plus(BigInt.fromI32(1))
  fromUser.lastTransactionTime = timestamp
  
  // 更新接收方
  toUser.totalReceived = toUser.totalReceived.plus(value)
  toUser.transactionCount = toUser.transactionCount.plus(BigInt.fromI32(1))
  toUser.lastTransactionTime = timestamp
  
  fromUser.save()
  toUser.save()
}
