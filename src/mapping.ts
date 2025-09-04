import { DataStored, ContractDeployed } from "../generated/DataStorage/DataStorage"
import { DataEntry, User, DataStorageContract, DailyStats } from "../generated/schema"
import { BigInt, Bytes } from "@graphprotocol/graph-ts"

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
  
  // 创建数据条目实体
  let dataEntryId = event.transaction.hash.concatI32(event.logIndex.toI32())
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
  
  // 更新合约统计
  let contractStats = DataStorageContract.load(event.address.toHexString())
  if (!contractStats) {
    contractStats = new DataStorageContract(event.address.toHexString())
    contractStats.totalEntries = BigInt.fromI32(0)
    contractStats.totalUsers = BigInt.fromI32(0)
    contractStats.deploymentBlock = event.block.number
    contractStats.deploymentTime = event.block.timestamp
    contractStats.deployer = Bytes.empty() // 初始化为空，在ContractDeployed中设置
  }
  
  contractStats.totalEntries = contractStats.totalEntries.plus(BigInt.fromI32(1))
  
  // 检查是否是新用户
  if (user.totalEntries.equals(BigInt.fromI32(1))) {
    contractStats.totalUsers = contractStats.totalUsers.plus(BigInt.fromI32(1))
  }
  
  contractStats.save()
  
  // 更新每日统计
  let dayTimestamp = event.block.timestamp.toI32() / 86400 * 86400 // 标准化到当天开始
  let dayId = dayTimestamp.toString()
  let dailyStats = DailyStats.load(dayId)
  
  if (!dailyStats) {
    dailyStats = new DailyStats(dayId)
    // 将时间戳转换为 YYYY-MM-DD 格式
    let date = new Date(dayTimestamp * 1000)
    dailyStats.date = date.toISOString().split('T')[0]
    dailyStats.entriesCount = BigInt.fromI32(0)
    dailyStats.activeUsers = BigInt.fromI32(0)
    dailyStats.newUsers = BigInt.fromI32(0)
  }
  
  dailyStats.entriesCount = dailyStats.entriesCount.plus(BigInt.fromI32(1))
  
  // 检查是否是当天的新用户
  if (user.totalEntries.equals(BigInt.fromI32(1))) {
    dailyStats.newUsers = dailyStats.newUsers.plus(BigInt.fromI32(1))
  }
  
  dailyStats.save()
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