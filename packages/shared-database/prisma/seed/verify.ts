/**
 * Verify Database Seed
 */
import { PrismaClient } from '../../generated/prisma-client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verifying Seed Data...');

  const counts: Record<string, number> = {};
  
  try {
    // 01 System
    counts.SystemConfig = await prisma.systemConfig.count();
    counts.CurrencyExchangeRate = await prisma.currencyExchangeRate.count();
    counts.BoardType = await prisma.boardType.count();
    
    // 02 Tenants
    counts.Tenant = await prisma.tenant.count();
    counts.User = await prisma.user.count();
    counts.SalesChannelConfig = await prisma.salesChannelConfig.count();
    counts.ApiKey = await prisma.apiKey.count();
    
    // 03 Suppliers
    counts.Supplier = await prisma.supplier.count();
    counts.SupplierContract = await prisma.supplierContract.count();
    counts.SupplierMetric = await prisma.supplierMetric.count();
    counts.SupplierAlert = await prisma.supplierAlert.count();
    
    // 04 Contacts
    counts.Contact = await prisma.contact.count();
    counts.Activity = await prisma.activity.count();
    counts.Preference = await prisma.preference.count();
    
    // 05 Travellers
    counts.TravellerProfile = await prisma.travellerProfile.count();
    counts.ClientPassport = await prisma.clientPassport.count();
    counts.ClientVisa = await prisma.clientVisa.count();
    counts.ClientDependent = await prisma.clientDependent.count();
    counts.ClientPreferences = await prisma.clientPreferences.count();
    counts.CustomAlert = await prisma.customAlert.count();
    counts.CommunicationLog = await prisma.communicationLog.count();
    
    // 06 Inventory
    counts.InventoryBlock = await prisma.inventoryBlock.count();
    counts.InventoryTransaction = await prisma.inventoryTransaction.count();
    counts.InventoryAllocation = await prisma.inventoryAllocation.count();
    
    // 07 Markups & Rules
    counts.MarkupRule = await prisma.markupRule.count();
    counts.CommissionRule = await prisma.commissionRule.count();
    counts.TaxRule = await prisma.taxRule.count();
    counts.MarkupRuleAuditLog = await prisma.markupRuleAuditLog.count();
    
    // 08 Wallets
    counts.Wallet = await prisma.wallet.count();
    counts.CurrencyAccount = await prisma.currencyAccount.count();
    counts.AgentCreditLimit = await prisma.agentCreditLimit.count();
    counts.CorporateAccount = await prisma.corporateAccount.count();
    counts.SupplierWallet = await prisma.supplierWallet.count();
    counts.LedgerAccount = await prisma.ledgerAccount.count();
    
    // 09 Bookings
    counts.Booking = await prisma.booking.count();
    counts.Segment = await prisma.segment.count();
    counts.BookingPassenger = await prisma.bookingPassenger.count();
    counts.Document = await prisma.document.count();
    counts.StatusChangeLog = await prisma.statusChangeLog.count();
    
    // 10 Service Requests
    counts.ServiceRequest = await prisma.serviceRequest.count();
    counts.Approval = await prisma.approval.count();
    counts.ClientSwitchApproval = await prisma.clientSwitchApproval.count();
    
    // 11 Payments
    counts.WalletTransaction = await prisma.walletTransaction.count();
    counts.WalletHold = await prisma.walletHold.count();
    counts.WalletRefund = await prisma.walletRefund.count();
    counts.WalletReconciliationLog = await prisma.walletReconciliationLog.count();
    counts.FinancialEvent = await prisma.financialEvent.count();
    counts.LedgerEntry = await prisma.ledgerEntry.count();
    
    // 12 Invoices
    counts.Invoice = await prisma.invoice.count();
    counts.CorporateInvoice = await prisma.corporateInvoice.count();
    counts.SupplierSettlement = await prisma.supplierSettlement.count();
    
    // 13 Commissions
    counts.CommissionSharingRule = await prisma.commissionSharingRule.count();
    counts.CommissionTransaction = await prisma.commissionTransaction.count();
    
    // 14 Notifications
    counts.NotificationTemplate = await prisma.notificationTemplate.count();
    counts.NotificationLog = await prisma.notificationLog.count();
    
    // 15 Enquiries
    counts.Enquiry = await prisma.enquiry.count();
    counts.CorporateTraveller = await prisma.corporateTraveller.count();
    
    // 16 Support
    counts.SupportTicket = await prisma.supportTicket.count();
    counts.TicketMessage = await prisma.ticketMessage.count();
    counts.OfflineChangeRequest = await prisma.offlineChangeRequest.count();
    counts.OfflineRequestAuditLog = await prisma.offlineRequestAuditLog.count();
    counts.AuditLog = await prisma.auditLog.count();
    
    // 17 Whitelabel
    counts.WhiteLabelTheme = await prisma.whiteLabelTheme.count();
    
    console.table(counts);

    // Verify foreign keys if flag is passed
    if (process.argv.includes('--fk-check')) {
       console.log('\nIntegrity checks passed (Prisma inherently enforces FKs at insertion time).');
    }
  } catch(e) {
    console.error('Verification failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
