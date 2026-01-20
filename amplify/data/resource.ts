import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({

  Make: a
    .model({
      makeId: a.string().required(),
      makeName: a.string().required(),
      country: a.string(),
      isClassic: a.boolean().default(false),
      aliases: a.string(),
      yearsFrom: a.integer(),
      yearsTo: a.integer(),
      popularitySeed: a.integer().default(0),
      models: a.hasMany('Model', 'makeId'),
    })
    .identifier(['makeId'])
    .authorization((allow) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  Model: a
    .model({
      modelId: a.string().required(),
      makeId: a.string().required(),
      modelName: a.string().required(),
      fullName: a.string().required(),
      yearsFrom: a.integer(),
      yearsTo: a.integer(),
      aliases: a.string(),
      make: a.belongsTo('Make', 'makeId'),
      engineVariants: a.hasMany('EngineVariant', 'modelId'),
    })
    .identifier(['modelId'])
    .authorization((allow) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  EngineVariant: a
    .model({
      modelId: a.string().required(),
      variantName: a.string().required(),
      engineCode: a.string(),
      displacementLiters: a.float(),
      cylinders: a.integer(),
      configuration: a.string(),
      aspiration: a.string(),
      horsepowerMin: a.integer(),
      horsepowerMax: a.integer(),
      fuelType: a.string(),
      yearsFrom: a.integer(),
      yearsTo: a.integer(),
      model: a.belongsTo('Model', 'modelId'),
    })
    .authorization((allow) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  Profile: a
    .model({
      ownerId: a.string(),
      username: a.string(),
      email: a.string(),
      firstName: a.string(),
      lastName: a.string(),
      displayName: a.string(),
      nickname: a.string(),
      bio: a.string(),
      avatarUrl: a.string(),
      coverImageUrl: a.string(),
      location: a.string(),
      phoneNumber: a.string(),
      accountType: a.enum(['collector', 'professional']),
      displayMode: a.enum(['real', 'nickname']),
      isPublic: a.boolean().default(true),
      cars: a.hasMany('Car', 'ownerId'),
    })
    .authorization((allow) => [
      allow.owner().to(['create', 'read', 'update', 'delete']),
      allow.authenticated().to(['read']),
    ]),

  Car: a
    .model({
      ownerId: a.string().required(),
      makeId: a.string().required(),
      modelId: a.string().required(),
      year: a.integer().required(),
      engineVariantId: a.string(),
      vin: a.string(),
      licensePlate: a.string(),
      color: a.string(),
      interiorColor: a.string(),
      mileage: a.integer(),
      mileageUnit: a.enum(['km', 'miles']),
      transmission: a.enum(['manual', 'automatic', 'semi_automatic']),
      driveType: a.enum(['lhd', 'rhd']),
      saleStatus: a.enum(['off_market', 'for_sale', 'sold']),
      price: a.float(),
      currency: a.string().default('EUR'),
      photos: a.string().array(),
      description: a.string(),
      isPublic: a.boolean().default(false),
      profile: a.belongsTo('Profile', 'ownerId'),
      documents: a.hasMany('CarDocument', 'carId'),
    })
    .authorization((allow) => [
      allow.owner().to(['create', 'read', 'update', 'delete']),
      allow.authenticated().to(['read']),
      allow.guest().to(['read']),
    ]),

  CarDocument: a
    .model({
      carId: a.string().required(),
      type: a.string().required(),
      name: a.string(),
      url: a.string().required(),
      car: a.belongsTo('Car', 'carId'),
    })
    .authorization((allow) => [
      allow.owner().to(['create', 'read', 'update', 'delete']),
    ]),

  FriendRequest: a
    .model({
      senderUserId: a.string().required(),
      receiverUserId: a.string().required(),
      status: a.enum(['pending', 'accepted', 'rejected']),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  Friendship: a
    .model({
      userId: a.string().required(),
      friendUserId: a.string().required(),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'delete']),
    ]),

  Conversation: a
    .model({
      participantUserIds: a.string().array().required(),
      lastMessage: a.string(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  Message: a
    .model({
      conversationId: a.string().required(),
      senderUserId: a.string().required(),
      body: a.string().required(),
      conversation: a.belongsTo('Conversation', 'conversationId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  Auction: a
    .model({
      auctionHouse: a.string().required(),  // 'RM Sothebys', 'Bonhams', 'Broad Arrow'
      lotNumber: a.string().required(),
      title: a.string().required(),
      description: a.string(),
      imageUrl: a.string(),
      estimateLow: a.integer(),
      estimateHigh: a.integer(),
      currency: a.string().default('USD'),
      currentBid: a.integer(),
      soldPrice: a.integer(),
      reserveStatus: a.enum(['reserve', 'no_reserve', 'unknown']),
      status: a.enum(['upcoming', 'live', 'sold', 'not_sold', 'withdrawn']),
      auctionDate: a.datetime(),
      auctionLocation: a.string(),
      auctionName: a.string(),
      lotUrl: a.string(),
      lastUpdated: a.datetime(),
    })
    .authorization((allow) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  // Automotive Events (shows, meets, races, etc.)
  Event: a
    .model({
      title: a.string().required(),
      description: a.string(),
      eventType: a.enum(['car_show', 'race', 'auction', 'meet', 'rally', 'festival', 'exhibition', 'track_day', 'other']),
      
      // Location
      venue: a.string(),
      address: a.string(),
      googleMapsAddress: a.string(),
      city: a.string().required(),
      region: a.string(),        // State/Province
      country: a.string().required(),
      latitude: a.float(),
      longitude: a.float(),
      
      // Dates
      startDate: a.datetime().required(),
      endDate: a.datetime(),
      
      // Details
      coverImage: a.string(),
      coverImageUrl: a.string(),
      website: a.string(),
      ticketUrl: a.string(),
      price: a.string(),         // "Free", "$50", "€25-€100"
      
      // Restrictions (up to 3, max 3 words each)
      restrictions: a.string().array(),

      // Status
      isPublished: a.boolean().default(true),
      isFeatured: a.boolean().default(false),
      visibility: a.enum(['public', 'members']),

      // Participants
      participantCount: a.integer().default(0),
      participants: a.hasMany('EventParticipant', 'eventId'),

      // Admin
      createdBy: a.string(),
    })
    .authorization((allow) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  // Event participants (users registered to events with their cars)
  EventParticipant: a
    .model({
      eventId: a.string().required(),
      oderId: a.string().required(),  // Owner ID (user ID)
      carId: a.string().required(),
      carMake: a.string().required(),
      carModel: a.string().required(),
      carYear: a.integer().required(),
      registeredAt: a.datetime(),
      event: a.belongsTo('Event', 'eventId'),
    })
    .authorization((allow) => [
      allow.owner().to(['create', 'read', 'delete']),
      allow.authenticated().to(['read']),
      allow.guest().to(['read']),
    ]),

  WikiCarEntry: a
    .model({
      makeId: a.string().required(),
      brandName: a.string().required(),
      makeName: a.string().required(),
      variant: a.string(),
      heroImageUrl: a.string(),
      sideImageUrl: a.string(),
      brandLogoUrl: a.string(),
      heroGallery: a.string(),
      production: a.string(),
      designer: a.string(),
      kerbWeight: a.string(),
      engine: a.string(),
      transmission: a.string(),
      power: a.string(),
      fuel: a.string(),
      topSpeed: a.string(),
      summary: a.string(),
      additionalFields: a.string(), // JSON encoded array of {label,value}
    })
    .authorization((allow) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  // Magazine subscriptions for News section
  Magazine: a
    .model({
      name: a.string().required(),
      description: a.string(),
      coverImage: a.string(),
      coverImageUrl: a.string(),
      price: a.float().required(),
      priceInterval: a.enum(['one_time', 'monthly', 'yearly']),
      websiteUrl: a.string(),
      discountType: a.enum(['fixed', 'percent']),
      discountValue: a.float(),
      discountCriteria: a.string(), // JSON encoded criteria array
      isActive: a.boolean().default(true),
      sortOrder: a.integer().default(0),
    })
    .authorization((allow) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
