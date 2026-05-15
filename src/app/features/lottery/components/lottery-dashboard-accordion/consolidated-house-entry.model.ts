import { House, HouseDto, LotteryTicketDto } from '@core/models/house.model';

export interface ConsolidatedHouseEntry {
  houseId: string;
  houseTitle: string;
  ticketCount: number;
  tickets: LotteryTicketDto[];
  status: string;
  isWinner: boolean;
  latestPurchaseDate: Date | string;
  totalSpent: number;
  location?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  propertyType?: string;
  ticketPrice?: number;
  drawDate?: Date | string;
  lotteryEndDate?: Date | string;
  houseImageUrl?: string;
}

export function consolidateActiveEntries(
  entries: LotteryTicketDto[],
  getHouseById?: (houseId: string) => House | HouseDto | undefined
): ConsolidatedHouseEntry[] {
  const groups = new Map<string, ConsolidatedHouseEntry>();

  for (const ticket of entries) {
    let group = groups.get(ticket.houseId);
    if (!group) {
      group = createGroupFromTicket(ticket, getHouseById?.(ticket.houseId));
      groups.set(ticket.houseId, group);
    }

    group.ticketCount += 1;
    group.tickets.push(ticket);
    group.totalSpent += ticket.purchasePrice ?? 0;

    const purchaseTime = new Date(ticket.purchaseDate).getTime();
    const latestTime = new Date(group.latestPurchaseDate).getTime();
    if (purchaseTime > latestTime) {
      group.latestPurchaseDate = ticket.purchaseDate;
    }

    if (ticket.isWinner) {
      group.isWinner = true;
    }
  }

  return Array.from(groups.values()).sort(
    (a, b) => new Date(b.latestPurchaseDate).getTime() - new Date(a.latestPurchaseDate).getTime()
  );
}

function createGroupFromTicket(
  ticket: LotteryTicketDto,
  house?: House | HouseDto
): ConsolidatedHouseEntry {
  const primaryImage = ticket.houseImageUrl ?? getHouseImageUrl(house);

  const squareFeet =
    ticket.houseSquareFeet ??
    (house && 'squareFeet' in house ? house.squareFeet : house && 'sqft' in house ? house.sqft : undefined);

  return {
    houseId: ticket.houseId,
    houseTitle: ticket.houseTitle || house?.title || 'Unknown House',
    ticketCount: 0,
    tickets: [],
    status: ticket.status,
    isWinner: ticket.isWinner,
    latestPurchaseDate: ticket.purchaseDate,
    totalSpent: 0,
    location: ticket.houseLocation ?? house?.location,
    bedrooms: ticket.houseBedrooms ?? house?.bedrooms,
    bathrooms: ticket.houseBathrooms ?? house?.bathrooms,
    squareFeet,
    propertyType: ticket.housePropertyType ?? (house && 'propertyType' in house ? house.propertyType : undefined),
    ticketPrice: ticket.houseTicketPrice ?? house?.ticketPrice,
    drawDate: ticket.houseDrawDate ?? (house && 'drawDate' in house ? house.drawDate : undefined),
    lotteryEndDate: ticket.houseLotteryEndDate ?? house?.lotteryEndDate,
    houseImageUrl: primaryImage
  };
}

function getHouseImageUrl(house?: House | HouseDto): string | undefined {
  if (!house?.images?.length) {
    return undefined;
  }

  const first = house.images[0];
  if ('imageUrl' in first) {
    const dtoImages = house.images as HouseDto['images'];
    return dtoImages.find((img) => img.isPrimary)?.imageUrl ?? dtoImages[0]?.imageUrl;
  }

  const legacyImages = house.images as House['images'];
  return legacyImages[0]?.url;
}
