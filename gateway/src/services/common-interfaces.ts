import {
  Contract,
  Transaction,
  Wallet,
  ContractInterface,
  BigNumber,
  ethers,
} from 'ethers';
import { EthereumBase } from './ethereum-base';
import { Provider } from '@ethersproject/abstract-provider';
import { CurrencyAmount, Token } from '@uniswap/sdk';
import { Trade } from '@uniswap/router-sdk';
import { Trade as UniswapV3Trade } from '@uniswap/v3-sdk';
import {
  TradeType,
  Currency,
  CurrencyAmount as UniswapCoreCurrencyAmount,
  Token as UniswapCoreToken,
  Fraction as UniswapFraction,
} from '@uniswap/sdk-core';
import {
  Token as TokenPangolin,
  CurrencyAmount as CurrencyAmountPangolin,
  Trade as TradePangolin,
  Fraction as PangolinFraction,
} from '@pangolindex/sdk';
import {
  Trade as SushiswapTrade,
  Token as SushiToken,
  CurrencyAmount as sushiCurrencyAmount,
  TradeType as SushiTradeType,
  Currency as SushiCurrency,
  Fraction as SushiFraction,
} from '@sushiswap/sdk';
import {
  Token as TokenTraderjoe,
  CurrencyAmount as CurrencyAmountTraderjoe,
  Trade as TradeTraderjoe,
  Fraction as TraderjoeFraction,
} from '@traderjoe-xyz/sdk';

export type Tokenish =
  | Token
  | TokenPangolin
  | TokenTraderjoe
  | UniswapCoreToken
  | SushiToken;
export type UniswapishTrade =
  | Trade<Currency, Currency, TradeType>
  | TradePangolin
  | TradeTraderjoe
  | SushiswapTrade<
      SushiToken,
      SushiToken,
      SushiTradeType.EXACT_INPUT | SushiTradeType.EXACT_OUTPUT
    >
  | UniswapV3Trade<Currency, UniswapCoreToken, TradeType>;
export type UniswapishAmount =
  | CurrencyAmount
  | CurrencyAmountPangolin
  | UniswapCoreCurrencyAmount<Currency>
  | CurrencyAmountTraderjoe
  | sushiCurrencyAmount<SushiCurrency | SushiToken>;
export type Fractionish =
  | UniswapFraction
  | PangolinFraction
  | TraderjoeFraction
  | SushiFraction;

export interface ExpectedTrade {
  trade: UniswapishTrade;
  expectedAmount: UniswapishAmount;
}

export interface PositionInfo {
  token0: string | undefined;
  token1: string | undefined;
  fee: string | undefined;
  lowerPrice: string;
  upperPrice: string;
  amount0: string;
  amount1: string;
  unclaimedToken0: string;
  unclaimedToken1: string;
}

export interface Uniswapish {
  /**
   * Router address.
   */
  router: string;

  /**
   * Router smart contract ABI.
   */
  routerAbi: ContractInterface;

  /**
   * Interface for decoding transaction logs
   */
  abiDecoder?: any;

  /**
   * Default gas limit for swap transactions.
   */
  gasLimit: number;

  /**
   * Default time-to-live for swap transactions, in seconds.
   */
  ttl: number;

  init(): Promise<void>;

  ready(): boolean;

  /**
   * Given a token's address, return the connector's native representation of
   * the token.
   *
   * @param address Token address
   */
  getTokenByAddress(address: string): Tokenish;

  /**
   * Given the amount of `baseToken` to put into a transaction, calculate the
   * amount of `quoteToken` that can be expected from the transaction.
   *
   * This is typically used for calculating token sell prices.
   *
   * @param baseToken Token input for the transaction
   * @param quoteToken Output from the transaction
   * @param amount Amount of `baseToken` to put into the transaction
   */
  estimateSellTrade(
    baseToken: Tokenish,
    quoteToken: Tokenish,
    amount: BigNumber,
    allowedSlippage?: string
  ): Promise<ExpectedTrade>;

  /**
   * Given the amount of `baseToken` desired to acquire from a transaction,
   * calculate the amount of `quoteToken` needed for the transaction.
   *
   * This is typically used for calculating token buy prices.
   *
   * @param quoteToken Token input for the transaction
   * @param baseToken Token output from the transaction
   * @param amount Amount of `baseToken` desired from the transaction
   */
  estimateBuyTrade(
    quoteToken: Tokenish,
    baseToken: Tokenish,
    amount: BigNumber,
    allowedSlippage?: string
  ): Promise<ExpectedTrade>;

  /**
   * Given a wallet and a Uniswap-ish trade, try to execute it on blockchain.
   *
   * @param wallet Wallet
   * @param trade Expected trade
   * @param gasPrice Base gas price, for pre-EIP1559 transactions
   * @param uniswapRouter Router smart contract address
   * @param ttl How long the swap is valid before expiry, in seconds
   * @param abi Router contract ABI
   * @param gasLimit Gas limit
   * @param nonce (Optional) EVM transaction nonce
   * @param maxFeePerGas (Optional) Maximum total fee per gas you want to pay
   * @param maxPriorityFeePerGas (Optional) Maximum tip per gas you want to pay
   */
  executeTrade(
    wallet: Wallet,
    trade: UniswapishTrade,
    gasPrice: number,
    uniswapRouter: string,
    ttl: number,
    abi: ContractInterface,
    gasLimit: number,
    nonce?: number,
    maxFeePerGas?: BigNumber,
    maxPriorityFeePerGas?: BigNumber,
    allowedSlippage?: string
  ): Promise<Transaction>;
}

export interface UniswapLPish {
  /**
   * Router address.
   */
  router: string;

  /**
   * Router smart contract ABI.
   */
  routerAbi: ContractInterface;

  /**
   * NTF manager address.
   */
  nftManager: string;

  /**
   * NTF manager smart contract ABI.
   */
  nftAbi: ContractInterface;

  /**
   * Pool smart contract ABI.
   */
  poolAbi: ContractInterface;

  /**
   * Interface for decoding transaction logs
   */
  abiDecoder: any;

  /**
   * Default gas limit for swap transactions.
   */
  gasLimit: number;

  /**
   * Default time-to-live for swap transactions, in seconds.
   */
  ttl: number;

  init(): Promise<void>;

  ready(): boolean;

  /**
   * Given a token's address, return the connector's native representation of
   * the token.
   *
   * @param address Token address
   */
  getTokenByAddress(address: string): Tokenish;

  /**
   * Given a wallet and tokenId, fetch info about position.
   *
   * @param tokenId: id of exiting position to fetch liquidity data
   */
  getPosition(tokenId: number): Promise<PositionInfo>;

  /**
   * Given a wallet, add/increase liquidity for a position.
   *
   * @param wallet Wallet for the transaction
   * @param token0 Token 1 for position
   * @param token1 Token 0 for position
   * @param amount0 Amount of `token0` to put into the position
   * @param amount1 Amount of `token1` to put into the position
   * @param fee Fee tier of position,
   * @param lowerPrice lower price bound of the position
   * @param upperPrice upper price bound for the position
   * @param tokenId id of exiting position to increase liquidity
   * @param gasLimit Gas limit
   * @param nonce (Optional) EVM transaction nonce
   * @param maxFeePerGas (Optional) Maximum total fee per gas you want to pay
   * @param maxPriorityFeePerGas (Optional) Maximum tip per gas you want to pay
   */
  addPosition(
    wallet: Wallet,
    token0: UniswapCoreToken,
    token1: UniswapCoreToken,
    amount0: string,
    amount1: string,
    fee: number,
    lowerPrice: number,
    upperPrice: number,
    tokenId: number,
    gasLimit: number,
    gasPrice: number,
    nonce?: number,
    maxFeePerGas?: BigNumber,
    maxPriorityFeePerGas?: BigNumber
  ): Promise<Transaction>;

  /**
   * Given a wallet, reduce/remove liquidity for a position.
   *
   * @param wallet Wallet for the transaction
   * @param tokenId id of exiting position to decrease liquidity
   * @param decreasePercent: percentage of liquidity to remove
   * @param getFee used to estimate the gas cost of closing position
   * @param gasLimit Gas limit
   * @param nonce (Optional) EVM transaction nonce
   * @param maxFeePerGas (Optional) Maximum total fee per gas you want to pay
   * @param maxPriorityFeePerGas (Optional) Maximum tip per gas you want to pay
   */
  reducePosition(
    wallet: Wallet,
    tokenId: number,
    decreasePercent: number,
    gasLimit: number,
    gasPrice: number,
    nonce?: number,
    maxFeePerGas?: BigNumber,
    maxPriorityFeePerGas?: BigNumber
  ): Promise<Transaction>;

  /**
   * Given a wallet and tokenId, collect earned fees on position.
   *
   * @param wallet Wallet for the transaction
   * @param tokenId id of exiting position to collet earned fees
   * @param gasLimit Gas limit
   * @param nonce (Optional) EVM transaction nonce
   * @param maxFeePerGas (Optional) Maximum total fee per gas you want to pay
   * @param maxPriorityFeePerGas (Optional) Maximum tip per gas you want to pay
   */
  collectFees(
    wallet: Wallet,
    tokenId: number,
    gasLimit: number,
    gasPrice: number,
    nonce?: number,
    maxFeePerGas?: BigNumber,
    maxPriorityFeePerGas?: BigNumber
  ): Promise<Transaction | { amount0: BigNumber; amount1: BigNumber }>;

  /**
   * Given a fee tier, tokens and time parameters, fetch historical pool prices.
   *
   * @param token0 Token in pool
   * @param token1 Token in pool
   * @param fee fee tier
   * @param period total period of time to fetch pool prices in seconds
   * @param interval interval within period to fetch pool prices
   */
  poolPrice(
    token0: UniswapCoreToken,
    token1: UniswapCoreToken,
    fee: number,
    period: number,
    interval: number
  ): Promise<string[]>;
}

export interface Ethereumish extends EthereumBase {
  cancelTx(wallet: Wallet, nonce: number): Promise<Transaction>;
  getSpender(reqSpender: string): string;
  getContract(
    tokenAddress: string,
    signerOrProvider?: Wallet | Provider
  ): Contract;
  gasPrice: number;
  nativeTokenSymbol: string;
  chain: string;
}

export interface NetworkSelectionRequest {
  connector?: string; //the target connector (e.g. uniswap or pangolin)
  chain: string; //the target chain (e.g. ethereum, avalanche, or harmony)
  network: string; // the target network of the chain (e.g. mainnet)
}

export interface CustomTransactionReceipt
  extends Omit<
    ethers.providers.TransactionReceipt,
    'gasUsed' | 'cumulativeGasUsed' | 'effectiveGasPrice'
  > {
  gasUsed: string;
  cumulativeGasUsed: string;
  effectiveGasPrice: string | null;
}

export interface CustomTransaction
  extends Omit<
    Transaction,
    'maxPriorityFeePerGas' | 'maxFeePerGas' | 'gasLimit' | 'value'
  > {
  maxPriorityFeePerGas: string | null;
  maxFeePerGas: string | null;
  gasLimit: string | null;
  value: string;
}

export interface CustomTransactionResponse
  extends Omit<
    ethers.providers.TransactionResponse,
    'gasPrice' | 'gasLimit' | 'value'
  > {
  gasPrice: string | null;
  gasLimit: string;
  value: string;
}
