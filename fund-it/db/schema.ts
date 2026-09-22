import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  uuid,
  primaryKey,
  date,
} from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from 'next-auth/adapters';

/**
 * Auth.js tables. Shape follows the official Drizzle adapter schema
 * (https://authjs.dev/getting-started/adapters/drizzle) so the adapter
 * works without extra mapping. Only the email magic-link provider is
 * used, but `accounts` is kept in case an OAuth provider gets added later.
 */
export const users = pgTable('user', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
});

export const accounts = pgTable(
  'account',
  {
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: uuid('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => ({
    compositePk: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

/**
 * A profile is who Fund It is searching for. Sai and Pat each have their
 * own login, so their profile's `userId` points at their own account.
 * Kamalei and Keala (and anyone else too young for a login) are "managed":
 * `isManaged` is true and `userId` stays null, but `ownerUserId` still
 * points at the adult managing them so their saved items show up in that
 * adult's dashboard.
 */
export const profiles = pgTable('profile', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerUserId: uuid('ownerUserId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  userId: uuid('userId').references(() => users.id, { onDelete: 'set null' }),
  isManaged: boolean('isManaged').notNull().default(false),
  name: text('name').notNull(),
  age: integer('age'),
  gender: text('gender'),
  ethnicity: text('ethnicity'),
  hsGradYear: integer('hsGradYear'),
  interests: text('interests'),
  // Which opportunity types this profile generally wants surfaced.
  // e.g. ["scholarship","grant","certification","class","internship","sponsorship","webinar"]
  wantedTypes: jsonb('wantedTypes').$type<string[]>().notNull().default([]),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
});

/**
 * A person's own reusable "specifics" quick-picks, e.g. Polynesian,
 * football, heart surgery. Separate from the common presets (athletic,
 * sports, academic) which live in code, not the database, since they're
 * the same for everyone.
 */
export const customTags = pgTable('customTag', {
  id: uuid('id').defaultRandom().primaryKey(),
  profileId: uuid('profileId')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
});

/**
 * One row per search run, on-demand ("clean sheet") or recurring. This is
 * the search history list a profile can look back through and rerun.
 */
export const searches = pgTable('search', {
  id: uuid('id').defaultRandom().primaryKey(),
  profileId: uuid('profileId')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  types: jsonb('types').$type<string[]>().notNull().default([]),
  specifics: jsonb('specifics').$type<string[]>().notNull().default([]),
  source: text('source').$type<'on_demand' | 'recurring'>().notNull(),
  status: text('status')
    .$type<'pending' | 'running' | 'done' | 'error'>()
    .notNull()
    .default('pending'),
  errorMessage: text('errorMessage'),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  completedAt: timestamp('completedAt', { mode: 'date' }),
});

/**
 * A single found opportunity. `status` null means it was found but nobody
 * has reacted to it yet; see the lifecycle rules in lib/lifecycle.ts.
 */
export const opportunities = pgTable('opportunity', {
  id: uuid('id').defaultRandom().primaryKey(),
  profileId: uuid('profileId')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  searchId: uuid('searchId').references(() => searches.id, {
    onDelete: 'set null',
  }),
  title: text('title').notNull(),
  org: text('org'),
  category: text('category').notNull(), // scholarship, grant, certification, class, internship, sponsorship, webinar, other
  url: text('url').notNull(),
  deadline: date('deadline', { mode: 'string' }),
  amount: text('amount'),
  whyFit: text('whyFit').notNull(),
  status: text('status').$type<
    'interested' | 'applied' | 'not_interested' | 'other' | null
  >(),
  otherNote: text('otherNote'),
  discoverIt: boolean('discoverIt').notNull().default(false),
  foundAt: timestamp('foundAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
  deadlineReminderSentAt: timestamp('deadlineReminderSentAt', { mode: 'date' }),
});
