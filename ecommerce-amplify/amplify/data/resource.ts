import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { aiEnrichVehicle } from '../functions/ai-enrich-vehicle/resource';
import { createInquiry } from '../functions/create-inquiry/resource';

const schema = a.schema({
  Make: a
    .model({
      id: a.id().required(),
      name: a.string().required(),
      slug: a.string().required(),
      logoUrl: a.string(),
      sortOrder: a.integer().default(0),
      isActive: a.boolean().default(true),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      vehicles: a.hasMany('Vehicle', 'makeId'),
    })
    .secondaryIndexes((index) => [index('slug')])
    .authorization((allow) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read']),
      allow.group('Admin').to(['create', 'read', 'update', 'delete']),
    ]),

  BodyType: a
    .model({
      id: a.id().required(),
      name: a.string().required(),
      slug: a.string().required(),
      iconUrl: a.string(),
      sortOrder: a.integer().default(0),
      isActive: a.boolean().default(true),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      vehicles: a.hasMany('Vehicle', 'bodyTypeId'),
    })
    .secondaryIndexes((index) => [index('slug')])
    .authorization((allow) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read']),
      allow.group('Admin').to(['create', 'read', 'update', 'delete']),
    ]),

  Vehicle: a
    .model({
      id: a.id().required(),
      makeId: a.id().required(),
      modelName: a.string().required(),
      trim: a.string(),
      year: a.integer().required(),
      bodyTypeId: a.id(),
      price: a.float().required(),
      listPrice: a.float(),
      currency: a.string().default('ILS'),
      mileage: a.integer(),
      transmission: a.enum(['AUTO', 'MANUAL', 'DSG', 'CVT']),
      fuelType: a.enum(['GASOLINE', 'DIESEL', 'HYBRID', 'ELECTRIC', 'PLUGIN_HYBRID', 'LPG']),
      enginePower: a.integer(),
      engineCapacity: a.integer(),
      driveType: a.enum(['FWD', 'RWD', 'AWD', 'FOUR_WD']),
      color: a.string(),
      interiorColor: a.string(),
      doors: a.integer(),
      seats: a.integer(),
      vin: a.string(),
      plateNumber: a.string(),
      firstRegistrationDate: a.date(),
      hand: a.integer(),
      previousOwners: a.integer(),
      ownershipType: a.enum(['PRIVATE', 'LEASING', 'RENTAL', 'TAXI', 'COMPANY', 'IMPORTER']),
      accidentFree: a.boolean().default(true),
      inspectionExpiryDate: a.date(),
      status: a.enum(['AVAILABLE', 'RESERVED', 'SOLD', 'HIDDEN']),
      isFeatured: a.boolean().default(false),
      condition: a.enum(['NEW', 'USED', 'DEMO']),
      description: a.string(),
      features: a.string().array(),
      images: a.string().array(),
      branchLocation: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      deletedAt: a.datetime(),
      deletedBy: a.string(),
      deleteReason: a.string(),
      make: a.belongsTo('Make', 'makeId'),
      bodyType: a.belongsTo('BodyType', 'bodyTypeId'),
      searchMeta: a.hasOne('VehicleSearchMeta', 'vehicleId'),
      inquiries: a.hasMany('Inquiry', 'vehicleId'),
    })
    .secondaryIndexes((index) => [
      index('makeId').sortKeys(['year']).name('byMakeYear'),
      index('bodyTypeId').sortKeys(['createdAt']).name('byBodyTypeCreatedAt'),
      index('status').sortKeys(['createdAt']).name('byStatusCreatedAt'),
    ])
    .authorization((allow) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read']),
      allow.group('Admin').to(['create', 'read', 'update', 'delete']),
    ]),

  VehicleSearchMeta: a
    .model({
      id: a.id().required(),
      vehicleId: a.id().required(),
      aiSummary: a.string(),
      aiHighlights: a.string().array(),
      aiSEO: a.string(),
      confidence: a.float(),
      language: a.string().default('he'),
      lastEnrichedAt: a.datetime(),
      enrichmentVersion: a.integer().default(1),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      vehicle: a.belongsTo('Vehicle', 'vehicleId'),
    })
    .secondaryIndexes((index) => [index('vehicleId')])
    .authorization((allow) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read']),
      allow.group('Admin').to(['create', 'read', 'update', 'delete']),
    ]),

  Inquiry: a
    .model({
      id: a.id().required(),
      vehicleId: a.id(),
      userId: a.string(),
      fullName: a.string().required(),
      phone: a.string().required(),
      email: a.string(),
      preferredContactMethod: a.enum(['PHONE', 'EMAIL', 'WHATSAPP']),
      message: a.string(),
      interestedInTestDrive: a.boolean().default(false),
      interestedInFinancing: a.boolean().default(false),
      tradeInDescription: a.string(),
      status: a.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'CLOSED_LOST']),
      assignedTo: a.string(),
      notes: a.string(),
      source: a.enum(['VEHICLE_PAGE', 'HOMEPAGE_HERO', 'CONTACT_PAGE', 'COMPARE_PAGE']),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      lastContactedAt: a.datetime(),
      vehicle: a.belongsTo('Vehicle', 'vehicleId'),
    })
    .secondaryIndexes((index) => [
      index('status').sortKeys(['createdAt']).name('byStatusCreatedAt'),
      index('vehicleId').sortKeys(['createdAt']).name('byVehicleCreatedAt'),
      index('assignedTo').sortKeys(['createdAt']).name('byAssignedCreatedAt'),
      index('userId').sortKeys(['createdAt']).name('byUserCreatedAt'),
    ])
    .authorization((allow) => [
      allow.guest().to(['create']),
      allow.authenticated().to(['create', 'read']),
      allow.group('Admin').to(['create', 'read', 'update', 'delete']),
    ]),

  UserProfile: a
    .model({
      id: a.id().required(),
      userId: a.string().required(),
      email: a.string(),
      firstName: a.string(),
      lastName: a.string(),
      phone: a.string(),
      avatarUrl: a.string(),
      savedVehicleIds: a.string().array(),
      preferences: a.json(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .secondaryIndexes((index) => [index('userId'), index('email')])
    .authorization((allow) => [
      allow.owner().identityClaim('sub'),
      allow.group('Admin').to(['read', 'update']),
    ]),

  SiteHero: a
    .model({
      id: a.id().required(),
      title: a.string().required(),
      subtitle: a.string(),
      ctaText: a.string(),
      ctaLink: a.string(),
      imageKey: a.string(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read']),
      allow.group('Admin').to(['create', 'read', 'update', 'delete']),
    ]),

  createInquiryMutation: a
    .mutation()
    .arguments({
      vehicleId: a.string(),
      fullName: a.string().required(),
      phone: a.string().required(),
      email: a.string(),
      preferredContactMethod: a.string(),
      message: a.string(),
      interestedInTestDrive: a.boolean(),
      interestedInFinancing: a.boolean(),
      tradeInDescription: a.string(),
      source: a.string(),
    })
    .returns(a.ref('Inquiry'))
    .authorization((allow) => [allow.guest(), allow.authenticated()])
    .handler(a.handler.function(createInquiry)),

  enrichVehicleMutation: a
    .mutation()
    .arguments({
      vehicleId: a.string().required(),
    })
    .returns(a.ref('VehicleSearchMeta'))
    .authorization((allow) => [allow.group('Admin')])
    .handler(a.handler.function(aiEnrichVehicle)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 365,
    },
  },
});
