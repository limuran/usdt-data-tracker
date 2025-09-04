import { DataStored, ContractDeployed } from "../generated/DataStorage/DataStorage"
import { DataEntry, User, DataStorageContract, DailyStats } from "../generated/schema"
import { BigInt, Bytes } from "@graphprotocol/graph-ts"

export function handleDataStored(event: DataStored): void {
  // 创建数据条目实体
  let id = event.transaction.hash.concatI32(event.logIndex.toI32())
  let dataEntry = new DataEntry(id)
  
  dataEntry.user = event.params.user
  dataEntry.data = event.params.data
  dataEntry.dataType = event.params.dataType
  dataEntry.timestamp = event.params.timestamp
  dataEntry.blockNumber = event.params.blockNumber
  dataEntry.dataHash = event.params.dataHash
  dataEntry.entryId = event.params.entryId
  dataEntry.transactionHash = event.transaction.hash
  
  dataEntry.save()
  
  // 更新用户统计
  let user = User.load(event.params.user.toHexString())
  if (!user) {
    user = new User(event.params.user.toHexString())
    user.totalEntries = BigInt.fromI32(0)
    user.firstEntryTime = event.params.timestamp
  }
  
  user.totalEntries = user.totalEntries.plus(BigInt.fromI32(1))
  user.lastEntryTime = event.params.timestamp
  user.save()
  
  // 更新合约统计
  let contractStats = DataStorageContract.load(event.address.toHexString())
  if (!contractStats) {
    contractStats = new DataStorageContract(event.address.toHexString())
    contractStats.totalEntries = BigInt.fromI32(0)
    contractStats.totalUsers = BigInt.fromI32(0)
    contractStats.deploymentBlock = event.block.number
    contractStats.deploymentTime = event.block.timestamp
  }
  
  contractStats.totalEntries = contractStats.totalEntries.plus(BigInt.fromI32(1))
  
  // 检查是否是新用户
  if (user.totalEntries.equals(BigInt.fromI32(1))) {
    contractStats.totalUsers = contractStats.totalUsers.plus(BigInt.fromI32(1))
  }
  
  contractStats.save()
  
  // 更新每日统计
  let dayId = (event.block.timestamp.toI32() / 86400).toString() // 天数
  let dailyStats = DailyStats.load(dayId)
  
  if (!dailyStats) {
    dailyStats = new DailyStats(dayId)
    dailyStats.date = dayId
    dailyStats.entriesCount = BigInt.fromI32(0)
    dailyStats.activeUsers = BigInt.fromI32(0)
    dailyStats.newUsers = BigInt.fromI32(0)
  }
  
  dailyStats.entriesCount = dailyStats.entriesCount.plus(BigInt.fromI32(1))
  dailyStats.save()
}

export function handleContractDeployed(event: ContractDeployed): void {
  let contractStats = new DataStorageContract(event.address.toHexString())
  
  contractStats.totalEntries = BigInt.fromI32(0)
  contractStats.totalUsers = BigInt.fromI32(0)
  contractStats.deploymentBlock = event.params.blockNumber
  contractStats.deploymentTime = event.params.timestamp
  contractStats.deployer = event.params.deployer
  
  contractStats.save()
}