import { DataStored, ContractDeployed, StoreDataCall } from "../generated/DataStorage/DataStorage"
import { DataEntry, User, DataStorageContract, DailyStats } from "../generated/schema"
import { BigInt, Bytes, crypto } from "@graphprotocol/graph-ts"

export function handleDataStored(event: DataStored): void {
  // 创建或加载用户实体
  let userId = event.params.user.toHexString()
  let user = User.load(userId)
  if (!user) {
    user = new User(userId)
    user.totalEntries = BigInt.fromI32(0)
    user.firstEntryTime = event.params.timestamp
  }
  
  user.totalEntries = user.totalEntries.plus(BigInt.fromI32(1))
  user.lastEntryTime = event.params.timestamp
  user.save()
  
  // 创建数据条目实体 - 修复 ID 类型
  let dataEntryId = event.transaction.hash.concatI32(event.logIndex.toI32()).toHexString()
  let dataEntry = new DataEntry(dataEntryId)
  
  dataEntry.user = userId // 引用 User 实体 ID
  dataEntry.userAddress = event.params.user // 保留原始地址
  dataEntry.data = event.params.data
  dataEntry.dataType = event.params.dataType
  dataEntry.timestamp = event.params.timestamp
  dataEntry.blockNumber = event.params.blockNumber
  dataEntry.dataHash = event.params.dataHash
  dataEntry.entryId = event.params.entryId
  dataEntry.transactionHash = event.transaction.hash
  
  dataEntry.save()
  
  updateContractStats(event.address, userId, user.totalEntries)
  updateDailyStats(event.block.timestamp, user.totalEntries)
}

export function handleContractDeployed(event: ContractDeployed): void {
  let contractStats = DataStorageContract.load(event.address.toHexString())
  
  if (!contractStats) {
    contractStats = new DataStorageContract(event.address.toHexString())
    contractStats.totalEntries = BigInt.fromI32(0)
    contractStats.totalUsers = BigInt.fromI32(0)
  }
  
  contractStats.deploymentBlock = event.params.blockNumber
  contractStats.deploymentTime = event.params.timestamp
  contractStats.deployer = event.params.deployer
  
  contractStats.save()
}

// 修复：处理函数调用（主要方案，因为合约不发出事件）
export function handleStoreDataCall(call: StoreDataCall): void {
  if (call.reverted) {
    return // 跳过失败的调用
  }

  // 创建或加载用户实体
  let userId = call.from.toHexString()
  let user = User.load(userId)
  if (!user) {
    user = new User(userId)
    user.totalEntries = BigInt.fromI32(0)
    user.firstEntryTime = call.block.timestamp
  }
  
  user.totalEntries = user.totalEntries.plus(BigInt.fromI32(1))
  user.lastEntryTime = call.block.timestamp
  user.save()
  
  // 创建数据条目实体 - 修复logIndex问题
  let dataEntryId = call.transaction.hash.toHexString()
  let dataEntry = new DataEntry(dataEntryId)
  
  dataEntry.user = userId
  dataEntry.userAddress = call.from
  dataEntry.data = call.inputs.data
  dataEntry.dataType = call.inputs.dataType
  dataEntry.timestamp = call.block.timestamp
  dataEntry.blockNumber = call.block.number
  // 生成数据哈希
  dataEntry.dataHash = crypto.keccak256(Bytes.fromUTF8(call.inputs.data))
  dataEntry.entryId = user.totalEntries
  dataEntry.transactionHash = call.transaction.hash
  
  dataEntry.save()
  
  updateContractStats(call.to, userId, user.totalEntries)
  updateDailyStats(call.block.timestamp, user.totalEntries)
}

// 辅助函数：更新合约统计
function updateContractStats(contractAddress: Bytes, userId: string, userTotalEntries: BigInt): void {
  let contractStats = DataStorageContract.load(contractAddress.toHexString())
  if (!contractStats) {
    contractStats = new DataStorageContract(contractAddress.toHexString())
    contractStats.totalEntries = BigInt.fromI32(0)
    contractStats.totalUsers = BigInt.fromI32(0)
    contractStats.deploymentBlock = BigInt.fromI32(0)
    contractStats.deploymentTime = BigInt.fromI32(0)
    contractStats.deployer = Bytes.empty()
  }
  
  contractStats.totalEntries = contractStats.totalEntries.plus(BigInt.fromI32(1))
  
  // 检查是否是新用户
  if (userTotalEntries.equals(BigInt.fromI32(1))) {
    contractStats.totalUsers = contractStats.totalUsers.plus(BigInt.fromI32(1))
  }
  
  contractStats.save()
}

// 辅助函数：更新每日统计
function updateDailyStats(blockTimestamp: BigInt, userTotalEntries: BigInt): void {
  let dayTimestamp = blockTimestamp.toI32() / 86400 * 86400
  let dayId = dayTimestamp.toString()
  let dailyStats = DailyStats.load(dayId)
  
  if (!dailyStats) {
    dailyStats = new DailyStats(dayId)
    let date = new Date(dayTimestamp * 1000)
    dailyStats.date = date.toISOString().split('T')[0]
    dailyStats.entriesCount = BigInt.fromI32(0)
    dailyStats.activeUsers = BigInt.fromI32(0)
    dailyStats.newUsers = BigInt.fromI32(0)
  }
  
  dailyStats.entriesCount = dailyStats.entriesCount.plus(BigInt.fromI32(1))
  
  if (userTotalEntries.equals(BigInt.fromI32(1))) {
    dailyStats.newUsers = dailyStats.newUsers.plus(BigInt.fromI32(1))
  }
  
  dailyStats.save()
}