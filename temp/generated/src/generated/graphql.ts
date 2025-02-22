import gql from "graphql-tag";
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never;
    };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  Date: { input: any; output: any };
  DateTime: { input: any; output: any };
  Decimal: { input: any; output: any };
  FileReference: { input: any; output: any };
  Json: { input: any; output: any };
  Time: { input: any; output: any };
};

export type AuthenticationPayload = {
  __typename?: "AuthenticationPayload";
  accessExpiresAt?: Maybe<Scalars["String"]["output"]>;
  accessExpiresIn?: Maybe<Scalars["Int"]["output"]>;
  isValid?: Maybe<Scalars["Boolean"]["output"]>;
  jwtToken?: Maybe<Scalars["String"]["output"]>;
  refreshExpiresAt?: Maybe<Scalars["String"]["output"]>;
  refreshExpiresIn?: Maybe<Scalars["Int"]["output"]>;
  refreshToken?: Maybe<Scalars["String"]["output"]>;
};

export type Blogpost = {
  __typename?: "Blogpost";
  content?: Maybe<Scalars["String"]["output"]>;
  contentPreview?: Maybe<Scalars["String"]["output"]>;
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  id?: Maybe<Scalars["Int"]["output"]>;
  publishDate?: Maybe<Scalars["Date"]["output"]>;
  status?: Maybe<StatusProperty10707188>;
  /** @deprecated Querying directly on a Image property is deprecated. Use the child fields 'url', 'name' and 'resized' instead. */
  thumbnail?: Maybe<Image>;
  title?: Maybe<Scalars["String"]["output"]>;
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
};

export enum BlogpostFieldsEnum {
  Content = "content",
  ContentPreview = "contentPreview",
  CreatedAt = "createdAt",
  Description = "description",
  Id = "id",
  PublishDate = "publishDate",
  Status = "status",
  Thumbnail = "thumbnail",
  Title = "title",
  UpdatedAt = "updatedAt",
}

export type BlogpostFilterInput = {
  _and?: InputMaybe<Array<InputMaybe<BlogpostFilterInput>>>;
  _or?: InputMaybe<Array<InputMaybe<BlogpostFilterInput>>>;
  content?: InputMaybe<StringOperator>;
  contentPreview?: InputMaybe<StringOperator>;
  createdAt?: InputMaybe<DateTimeOperator>;
  description?: InputMaybe<StringOperator>;
  id?: InputMaybe<IntOperator>;
  publishDate?: InputMaybe<DateOperator>;
  status?: InputMaybe<EnumOperator>;
  thumbnail?: InputMaybe<ImageOperator>;
  title?: InputMaybe<StringOperator>;
  updatedAt?: InputMaybe<DateTimeOperator>;
};

export type BlogpostList = {
  __typename?: "BlogpostList";
  results?: Maybe<Array<Maybe<Blogpost>>>;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

export type BlogpostRelationSortInput = {
  content?: InputMaybe<SortOrder>;
  contentPreview?: InputMaybe<SortOrder>;
  createdAt?: InputMaybe<SortOrder>;
  description?: InputMaybe<SortOrder>;
  id?: InputMaybe<SortOrder>;
  publishDate?: InputMaybe<SortOrder>;
  status?: InputMaybe<SortOrder>;
  thumbnail?: InputMaybe<SortOrder>;
  title?: InputMaybe<SortOrder>;
  updatedAt?: InputMaybe<SortOrder>;
};

export enum BlogpostRelationalFieldsEnum {
  Undefined = "undefined",
}

export type BlogpostSortInput = {
  field?: InputMaybe<BlogpostFieldsEnum>;
  order?: InputMaybe<SortOrder>;
  relation?: InputMaybe<BlogpostRelationSortInput>;
};

export type BooleanOperator = {
  eq?: InputMaybe<Scalars["Boolean"]["input"]>;
  neq?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type CarouselImage = {
  __typename?: "CarouselImage";
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  id?: Maybe<Scalars["Int"]["output"]>;
  /** @deprecated Querying directly on a Image property is deprecated. Use the child fields 'url', 'name' and 'resized' instead. */
  image?: Maybe<Image>;
  name?: Maybe<Scalars["String"]["output"]>;
  redirectLink?: Maybe<Scalars["String"]["output"]>;
  startDisplaying?: Maybe<Scalars["DateTime"]["output"]>;
  stopDisplaying?: Maybe<Scalars["DateTime"]["output"]>;
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
};

export enum CarouselImageFieldsEnum {
  CreatedAt = "createdAt",
  Id = "id",
  Image = "image",
  Name = "name",
  RedirectLink = "redirectLink",
  StartDisplaying = "startDisplaying",
  StopDisplaying = "stopDisplaying",
  UpdatedAt = "updatedAt",
}

export type CarouselImageFilterInput = {
  _and?: InputMaybe<Array<InputMaybe<CarouselImageFilterInput>>>;
  _or?: InputMaybe<Array<InputMaybe<CarouselImageFilterInput>>>;
  createdAt?: InputMaybe<DateTimeOperator>;
  id?: InputMaybe<IntOperator>;
  image?: InputMaybe<ImageOperator>;
  name?: InputMaybe<StringOperator>;
  redirectLink?: InputMaybe<StringOperator>;
  startDisplaying?: InputMaybe<DateTimeOperator>;
  stopDisplaying?: InputMaybe<DateTimeOperator>;
  updatedAt?: InputMaybe<DateTimeOperator>;
};

export type CarouselImageList = {
  __typename?: "CarouselImageList";
  results?: Maybe<Array<Maybe<CarouselImage>>>;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

export type CarouselImageRelationSortInput = {
  createdAt?: InputMaybe<SortOrder>;
  id?: InputMaybe<SortOrder>;
  image?: InputMaybe<SortOrder>;
  name?: InputMaybe<SortOrder>;
  redirectLink?: InputMaybe<SortOrder>;
  startDisplaying?: InputMaybe<SortOrder>;
  stopDisplaying?: InputMaybe<SortOrder>;
  updatedAt?: InputMaybe<SortOrder>;
};

export enum CarouselImageRelationalFieldsEnum {
  Undefined = "undefined",
}

export type CarouselImageSortInput = {
  field?: InputMaybe<CarouselImageFieldsEnum>;
  order?: InputMaybe<SortOrder>;
  relation?: InputMaybe<CarouselImageRelationSortInput>;
};

export enum CartTypeProperty1943605 {
  Merchandise = "Merchandise",
  Music = "Music",
}

export type Color = {
  __typename?: "Color";
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  hexcode?: Maybe<Scalars["String"]["output"]>;
  id?: Maybe<Scalars["Int"]["output"]>;
  label?: Maybe<Scalars["String"]["output"]>;
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
};

export enum ColorFieldsEnum {
  CreatedAt = "createdAt",
  Hexcode = "hexcode",
  Id = "id",
  Label = "label",
  UpdatedAt = "updatedAt",
}

export type ColorFilterInput = {
  _and?: InputMaybe<Array<InputMaybe<ColorFilterInput>>>;
  _or?: InputMaybe<Array<InputMaybe<ColorFilterInput>>>;
  createdAt?: InputMaybe<DateTimeOperator>;
  hexcode?: InputMaybe<StringOperator>;
  id?: InputMaybe<IntOperator>;
  label?: InputMaybe<StringOperator>;
  updatedAt?: InputMaybe<DateTimeOperator>;
};

export type ColorList = {
  __typename?: "ColorList";
  results?: Maybe<Array<Maybe<Color>>>;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

export type ColorRelationSortInput = {
  createdAt?: InputMaybe<SortOrder>;
  hexcode?: InputMaybe<SortOrder>;
  id?: InputMaybe<SortOrder>;
  label?: InputMaybe<SortOrder>;
  updatedAt?: InputMaybe<SortOrder>;
};

export enum ColorRelationalFieldsEnum {
  Undefined = "undefined",
}

export type ColorSortInput = {
  field?: InputMaybe<ColorFieldsEnum>;
  order?: InputMaybe<SortOrder>;
  relation?: InputMaybe<ColorRelationSortInput>;
};

export type Countries = {
  __typename?: "Countries";
  code?: Maybe<Scalars["String"]["output"]>;
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  id?: Maybe<Scalars["Int"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
  value?: Maybe<Scalars["Int"]["output"]>;
};

export enum CountriesFieldsEnum {
  Code = "code",
  CreatedAt = "createdAt",
  Id = "id",
  Name = "name",
  UpdatedAt = "updatedAt",
  Value = "value",
}

export type CountriesFilterInput = {
  _and?: InputMaybe<Array<InputMaybe<CountriesFilterInput>>>;
  _or?: InputMaybe<Array<InputMaybe<CountriesFilterInput>>>;
  code?: InputMaybe<StringOperator>;
  createdAt?: InputMaybe<DateTimeOperator>;
  id?: InputMaybe<IntOperator>;
  name?: InputMaybe<StringOperator>;
  updatedAt?: InputMaybe<DateTimeOperator>;
  value?: InputMaybe<IntOperator>;
};

export type CountriesList = {
  __typename?: "CountriesList";
  results?: Maybe<Array<Maybe<Countries>>>;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

export type CountriesRelationSortInput = {
  code?: InputMaybe<SortOrder>;
  createdAt?: InputMaybe<SortOrder>;
  id?: InputMaybe<SortOrder>;
  name?: InputMaybe<SortOrder>;
  updatedAt?: InputMaybe<SortOrder>;
  value?: InputMaybe<SortOrder>;
};

export enum CountriesRelationalFieldsEnum {
  Undefined = "undefined",
}

export type CountriesSortInput = {
  field?: InputMaybe<CountriesFieldsEnum>;
  order?: InputMaybe<SortOrder>;
  relation?: InputMaybe<CountriesRelationSortInput>;
};

export type CreateManyResult = {
  __typename?: "CreateManyResult";
  id?: Maybe<Array<Maybe<Scalars["Int"]["output"]>>>;
};

export type CreateResult = {
  __typename?: "CreateResult";
  id?: Maybe<Scalars["Int"]["output"]>;
};

export type DateOperator = {
  eq?: InputMaybe<Scalars["Date"]["input"]>;
  gt?: InputMaybe<Scalars["Date"]["input"]>;
  gteq?: InputMaybe<Scalars["Date"]["input"]>;
  in?: InputMaybe<Array<InputMaybe<Scalars["Date"]["input"]>>>;
  lt?: InputMaybe<Scalars["Date"]["input"]>;
  lteq?: InputMaybe<Scalars["Date"]["input"]>;
  neq?: InputMaybe<Scalars["Date"]["input"]>;
  nin?: InputMaybe<Array<InputMaybe<Scalars["Date"]["input"]>>>;
};

export type DateTimeOperator = {
  eq?: InputMaybe<Scalars["DateTime"]["input"]>;
  gt?: InputMaybe<Scalars["DateTime"]["input"]>;
  gteq?: InputMaybe<Scalars["DateTime"]["input"]>;
  in?: InputMaybe<Array<InputMaybe<Scalars["DateTime"]["input"]>>>;
  lt?: InputMaybe<Scalars["DateTime"]["input"]>;
  lteq?: InputMaybe<Scalars["DateTime"]["input"]>;
  neq?: InputMaybe<Scalars["DateTime"]["input"]>;
  nin?: InputMaybe<Array<InputMaybe<Scalars["DateTime"]["input"]>>>;
};

export type DecimalOperator = {
  eq?: InputMaybe<Scalars["Decimal"]["input"]>;
  gt?: InputMaybe<Scalars["Decimal"]["input"]>;
  gteq?: InputMaybe<Scalars["Decimal"]["input"]>;
  in?: InputMaybe<Array<InputMaybe<Scalars["Decimal"]["input"]>>>;
  lt?: InputMaybe<Scalars["Decimal"]["input"]>;
  lteq?: InputMaybe<Scalars["Decimal"]["input"]>;
  neq?: InputMaybe<Scalars["Decimal"]["input"]>;
  nin?: InputMaybe<Array<InputMaybe<Scalars["Decimal"]["input"]>>>;
};

export type DeleteManyResult = {
  __typename?: "DeleteManyResult";
  id?: Maybe<Array<Maybe<Scalars["Int"]["output"]>>>;
};

export type DeleteResult = {
  __typename?: "DeleteResult";
  id?: Maybe<Scalars["Int"]["output"]>;
};

export type Document = {
  __typename?: "Document";
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  /** @deprecated Querying directly on a File property is deprecated. Use the child fields 'url' and 'name' instead. */
  document?: Maybe<File>;
  /** @deprecated Querying directly on a File property is deprecated. Use the child fields 'url' and 'name' instead. */
  document_2?: Maybe<File>;
  id?: Maybe<Scalars["Int"]["output"]>;
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
};

export enum DocumentFieldsEnum {
  CreatedAt = "createdAt",
  Document = "document",
  Document_2 = "document_2",
  Id = "id",
  UpdatedAt = "updatedAt",
}

export type DocumentFilterInput = {
  _and?: InputMaybe<Array<InputMaybe<DocumentFilterInput>>>;
  _or?: InputMaybe<Array<InputMaybe<DocumentFilterInput>>>;
  createdAt?: InputMaybe<DateTimeOperator>;
  document?: InputMaybe<FileOperator>;
  document_2?: InputMaybe<FileOperator>;
  id?: InputMaybe<IntOperator>;
  updatedAt?: InputMaybe<DateTimeOperator>;
};

export type DocumentList = {
  __typename?: "DocumentList";
  results?: Maybe<Array<Maybe<Document>>>;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

export type DocumentRelationSortInput = {
  createdAt?: InputMaybe<SortOrder>;
  document?: InputMaybe<SortOrder>;
  document_2?: InputMaybe<SortOrder>;
  id?: InputMaybe<SortOrder>;
  updatedAt?: InputMaybe<SortOrder>;
};

export enum DocumentRelationalFieldsEnum {
  Undefined = "undefined",
}

export type DocumentSortInput = {
  field?: InputMaybe<DocumentFieldsEnum>;
  order?: InputMaybe<SortOrder>;
  relation?: InputMaybe<DocumentRelationSortInput>;
};

export type EnumOperator = {
  doesNotMatch?: InputMaybe<Scalars["String"]["input"]>;
  endsWith?: InputMaybe<Scalars["String"]["input"]>;
  eq?: InputMaybe<Scalars["String"]["input"]>;
  in?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
  matches?: InputMaybe<Scalars["String"]["input"]>;
  neq?: InputMaybe<Scalars["String"]["input"]>;
  nin?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
  regex?: InputMaybe<Scalars["String"]["input"]>;
  startsWith?: InputMaybe<Scalars["String"]["input"]>;
};

export type File = {
  __typename?: "File";
  name: Scalars["String"]["output"];
  url: Scalars["String"]["output"];
};

export enum FileFieldsEnum {
  Name = "name",
  Url = "url",
}

export type FileOperator = {
  doesNotMatch?: InputMaybe<Scalars["String"]["input"]>;
  endsWith?: InputMaybe<Scalars["String"]["input"]>;
  eq?: InputMaybe<Scalars["String"]["input"]>;
  matches?: InputMaybe<Scalars["String"]["input"]>;
  neq?: InputMaybe<Scalars["String"]["input"]>;
  regex?: InputMaybe<Scalars["String"]["input"]>;
  startsWith?: InputMaybe<Scalars["String"]["input"]>;
};

export type FileReferenceConvertFields = {
  __typename?: "FileReferenceConvertFields";
  contentType: Scalars["String"]["output"];
  expiration: Scalars["DateTime"]["output"];
  model: Scalars["String"]["output"];
  property: Scalars["String"]["output"];
};

export type FileReferenceConvertResult = {
  __typename?: "FileReferenceConvertResult";
  fields: FileReferenceConvertFields;
  fileUrl: Scalars["String"]["output"];
};

export type FileUploadRequestOptions = PresignedPostRequest;

export type Image = {
  __typename?: "Image";
  name: Scalars["String"]["output"];
  resized?: Maybe<Array<ResizedImage>>;
  url: Scalars["String"]["output"];
};

export type ImageOperator = {
  doesNotMatch?: InputMaybe<Scalars["String"]["input"]>;
  endsWith?: InputMaybe<Scalars["String"]["input"]>;
  eq?: InputMaybe<Scalars["String"]["input"]>;
  matches?: InputMaybe<Scalars["String"]["input"]>;
  neq?: InputMaybe<Scalars["String"]["input"]>;
  regex?: InputMaybe<Scalars["String"]["input"]>;
  startsWith?: InputMaybe<Scalars["String"]["input"]>;
};

export type IntOperator = {
  eq?: InputMaybe<Scalars["Int"]["input"]>;
  gt?: InputMaybe<Scalars["Int"]["input"]>;
  gteq?: InputMaybe<Scalars["Int"]["input"]>;
  in?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  lt?: InputMaybe<Scalars["Int"]["input"]>;
  lteq?: InputMaybe<Scalars["Int"]["input"]>;
  neq?: InputMaybe<Scalars["Int"]["input"]>;
  nin?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
};

export enum LocaleProperty7641993 {
  En = "en",
  Nl = "nl",
}

export type PresignedPostRequest = {
  __typename?: "PresignedPostRequest";
  fields: Scalars["Json"]["output"];
  reference: Scalars["FileReference"]["output"];
  url: Scalars["String"]["output"];
};

export type RefreshTokenPayload = {
  __typename?: "RefreshTokenPayload";
  accessExpiresAt?: Maybe<Scalars["String"]["output"]>;
  accessExpiresIn?: Maybe<Scalars["Int"]["output"]>;
  isValid?: Maybe<Scalars["Boolean"]["output"]>;
  jwtToken?: Maybe<Scalars["String"]["output"]>;
  refreshExpiresAt?: Maybe<Scalars["String"]["output"]>;
  refreshExpiresIn?: Maybe<Scalars["Int"]["output"]>;
  refreshToken?: Maybe<Scalars["String"]["output"]>;
};

export type Release = {
  __typename?: "Release";
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  id?: Maybe<Scalars["Int"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  releaseDate?: Maybe<Scalars["Date"]["output"]>;
  shareUrl?: Maybe<Scalars["String"]["output"]>;
  spotifyIframe?: Maybe<Scalars["String"]["output"]>;
  spotifyIframeContained?: Maybe<Scalars["String"]["output"]>;
  /** @deprecated Querying directly on a Image property is deprecated. Use the child fields 'url', 'name' and 'resized' instead. */
  thumbnail?: Maybe<Image>;
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
};

export enum ReleaseFieldsEnum {
  CreatedAt = "createdAt",
  Id = "id",
  Name = "name",
  ReleaseDate = "releaseDate",
  ShareUrl = "shareUrl",
  SpotifyIframe = "spotifyIframe",
  SpotifyIframeContained = "spotifyIframeContained",
  Thumbnail = "thumbnail",
  UpdatedAt = "updatedAt",
}

export type ReleaseFilterInput = {
  _and?: InputMaybe<Array<InputMaybe<ReleaseFilterInput>>>;
  _or?: InputMaybe<Array<InputMaybe<ReleaseFilterInput>>>;
  createdAt?: InputMaybe<DateTimeOperator>;
  id?: InputMaybe<IntOperator>;
  name?: InputMaybe<StringOperator>;
  releaseDate?: InputMaybe<DateOperator>;
  shareUrl?: InputMaybe<StringOperator>;
  spotifyIframe?: InputMaybe<StringOperator>;
  spotifyIframeContained?: InputMaybe<StringOperator>;
  thumbnail?: InputMaybe<ImageOperator>;
  updatedAt?: InputMaybe<DateTimeOperator>;
};

export type ReleaseList = {
  __typename?: "ReleaseList";
  results?: Maybe<Array<Maybe<Release>>>;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

export type ReleaseRelationSortInput = {
  createdAt?: InputMaybe<SortOrder>;
  id?: InputMaybe<SortOrder>;
  name?: InputMaybe<SortOrder>;
  releaseDate?: InputMaybe<SortOrder>;
  shareUrl?: InputMaybe<SortOrder>;
  spotifyIframe?: InputMaybe<SortOrder>;
  spotifyIframeContained?: InputMaybe<SortOrder>;
  thumbnail?: InputMaybe<SortOrder>;
  updatedAt?: InputMaybe<SortOrder>;
};

export enum ReleaseRelationalFieldsEnum {
  Undefined = "undefined",
}

export type ReleaseSortInput = {
  field?: InputMaybe<ReleaseFieldsEnum>;
  order?: InputMaybe<SortOrder>;
  relation?: InputMaybe<ReleaseRelationSortInput>;
};

export type ReserveRecordsPayload = {
  __typename?: "ReserveRecordsPayload";
  ids: Array<Scalars["Int"]["output"]>;
};

export type ResizedImage = {
  __typename?: "ResizedImage";
  name: Scalars["String"]["output"];
  size: Size;
  url: Scalars["String"]["output"];
};

export type RevokeRefreshTokenPayload = {
  __typename?: "RevokeRefreshTokenPayload";
  refreshId?: Maybe<Scalars["String"]["output"]>;
  removed?: Maybe<Scalars["Boolean"]["output"]>;
};

export type Role = {
  __typename?: "Role";
  canImport?: Maybe<Scalars["Boolean"]["output"]>;
  createFilters?: Maybe<Scalars["Boolean"]["output"]>;
  createFiltersForOthers?: Maybe<Scalars["Boolean"]["output"]>;
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  id?: Maybe<Scalars["Int"]["output"]>;
  impersonate?: Maybe<Scalars["Boolean"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
  users?: Maybe<Array<Maybe<User>>>;
  webUsers?: Maybe<Array<Maybe<Webuser>>>;
};

export type RoleUsersArgs = {
  sort?: InputMaybe<UserSortInput>;
  where?: InputMaybe<UserFilterInput>;
};

export type RoleWebUsersArgs = {
  sort?: InputMaybe<WebuserSortInput>;
  where?: InputMaybe<WebuserFilterInput>;
};

export enum RoleFieldsEnum {
  CanImport = "canImport",
  CreateFilters = "createFilters",
  CreateFiltersForOthers = "createFiltersForOthers",
  CreatedAt = "createdAt",
  Id = "id",
  Impersonate = "impersonate",
  Name = "name",
  UpdatedAt = "updatedAt",
}

export type RoleFilterInput = {
  _and?: InputMaybe<Array<InputMaybe<RoleFilterInput>>>;
  _or?: InputMaybe<Array<InputMaybe<RoleFilterInput>>>;
  canImport?: InputMaybe<BooleanOperator>;
  createFilters?: InputMaybe<BooleanOperator>;
  createFiltersForOthers?: InputMaybe<BooleanOperator>;
  createdAt?: InputMaybe<DateTimeOperator>;
  id?: InputMaybe<IntOperator>;
  impersonate?: InputMaybe<BooleanOperator>;
  name?: InputMaybe<StringOperator>;
  updatedAt?: InputMaybe<DateTimeOperator>;
  users?: InputMaybe<Array<InputMaybe<UserFilterInput>>>;
  webUsers?: InputMaybe<Array<InputMaybe<WebuserFilterInput>>>;
};

export type RoleList = {
  __typename?: "RoleList";
  results?: Maybe<Array<Maybe<Role>>>;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

export type RoleRelationInput = {
  id?: InputMaybe<Scalars["Int"]["input"]>;
};

export type RoleRelationMethodInput = {
  _add?: InputMaybe<Array<InputMaybe<RoleRelationInput>>>;
  _remove?: InputMaybe<Array<InputMaybe<RoleRelationInput>>>;
  _replace?: InputMaybe<Array<InputMaybe<RoleRelationInput>>>;
};

export type RoleRelationSortInput = {
  canImport?: InputMaybe<SortOrder>;
  createFilters?: InputMaybe<SortOrder>;
  createFiltersForOthers?: InputMaybe<SortOrder>;
  createdAt?: InputMaybe<SortOrder>;
  id?: InputMaybe<SortOrder>;
  impersonate?: InputMaybe<SortOrder>;
  name?: InputMaybe<SortOrder>;
  updatedAt?: InputMaybe<SortOrder>;
};

export enum RoleRelationalFieldsEnum {
  Undefined = "undefined",
}

export type RoleSortInput = {
  field?: InputMaybe<RoleFieldsEnum>;
  order?: InputMaybe<SortOrder>;
  relation?: InputMaybe<RoleRelationSortInput>;
};

export type RootMutationType = {
  __typename?: "RootMutationType";
  generateFileUploadRequest: FileUploadRequestOptions;
  login?: Maybe<AuthenticationPayload>;
  refreshToken?: Maybe<RefreshTokenPayload>;
  revokeRefreshToken?: Maybe<RevokeRefreshTokenPayload>;
};

export type RootMutationTypeGenerateFileUploadRequestArgs = {
  contentType: Scalars["String"]["input"];
  fileName: Scalars["String"]["input"];
  modelName: Scalars["String"]["input"];
  propertyName: Scalars["String"]["input"];
};

export type RootMutationTypeLoginArgs = {
  authProfileUuid: Scalars["String"]["input"];
  callbackUrl?: InputMaybe<Scalars["String"]["input"]>;
  password?: InputMaybe<Scalars["String"]["input"]>;
  redirectUrl?: InputMaybe<Scalars["String"]["input"]>;
  username?: InputMaybe<Scalars["String"]["input"]>;
};

export type RootMutationTypeRefreshTokenArgs = {
  token: Scalars["String"]["input"];
};

export type RootMutationTypeRevokeRefreshTokenArgs = {
  token: Scalars["String"]["input"];
};

export type RootQueryType = {
  __typename?: "RootQueryType";
  allBlogpost?: Maybe<BlogpostList>;
  allCarouselImage?: Maybe<CarouselImageList>;
  allColor?: Maybe<ColorList>;
  allCountries?: Maybe<CountriesList>;
  allDocument?: Maybe<DocumentList>;
  allFile?: Maybe<_FileList>;
  allRelease?: Maybe<ReleaseList>;
  allRole?: Maybe<RoleList>;
  allShopItem?: Maybe<ShopItemList>;
  allShoppingCart?: Maybe<ShoppingCartList>;
  allTestOne?: Maybe<TestOneList>;
  allTestTwo?: Maybe<TestTwoList>;
  allUser?: Maybe<UserList>;
  allWebuser?: Maybe<WebuserList>;
  meUser?: Maybe<User>;
  meWebuser?: Maybe<Webuser>;
  oneBlogpost?: Maybe<Blogpost>;
  oneCarouselImage?: Maybe<CarouselImage>;
  oneColor?: Maybe<Color>;
  oneCountries?: Maybe<Countries>;
  oneDocument?: Maybe<Document>;
  oneFile?: Maybe<_File>;
  oneRelease?: Maybe<Release>;
  oneRole?: Maybe<Role>;
  oneShopItem?: Maybe<ShopItem>;
  oneShoppingCart?: Maybe<ShoppingCart>;
  oneTestOne?: Maybe<TestOne>;
  oneTestTwo?: Maybe<TestTwo>;
  oneUser?: Maybe<User>;
  oneWebuser?: Maybe<Webuser>;
};

export type RootQueryTypeAllBlogpostArgs = {
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  sort?: InputMaybe<BlogpostSortInput>;
  take?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<BlogpostFilterInput>;
};

export type RootQueryTypeAllCarouselImageArgs = {
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  sort?: InputMaybe<CarouselImageSortInput>;
  take?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<CarouselImageFilterInput>;
};

export type RootQueryTypeAllColorArgs = {
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  sort?: InputMaybe<ColorSortInput>;
  take?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<ColorFilterInput>;
};

export type RootQueryTypeAllCountriesArgs = {
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  sort?: InputMaybe<CountriesSortInput>;
  take?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<CountriesFilterInput>;
};

export type RootQueryTypeAllDocumentArgs = {
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  sort?: InputMaybe<DocumentSortInput>;
  take?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<DocumentFilterInput>;
};

export type RootQueryTypeAllFileArgs = {
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  sort?: InputMaybe<_FileSortInput>;
  take?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<_FileFilterInput>;
};

export type RootQueryTypeAllReleaseArgs = {
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  sort?: InputMaybe<ReleaseSortInput>;
  take?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<ReleaseFilterInput>;
};

export type RootQueryTypeAllRoleArgs = {
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  sort?: InputMaybe<RoleSortInput>;
  take?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<RoleFilterInput>;
};

export type RootQueryTypeAllShopItemArgs = {
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  sort?: InputMaybe<ShopItemSortInput>;
  take?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<ShopItemFilterInput>;
};

export type RootQueryTypeAllShoppingCartArgs = {
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  sort?: InputMaybe<ShoppingCartSortInput>;
  take?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<ShoppingCartFilterInput>;
};

export type RootQueryTypeAllTestOneArgs = {
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  sort?: InputMaybe<TestOneSortInput>;
  take?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<TestOneFilterInput>;
};

export type RootQueryTypeAllTestTwoArgs = {
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  sort?: InputMaybe<TestTwoSortInput>;
  take?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<TestTwoFilterInput>;
};

export type RootQueryTypeAllUserArgs = {
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  sort?: InputMaybe<UserSortInput>;
  take?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<UserFilterInput>;
};

export type RootQueryTypeAllWebuserArgs = {
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  sort?: InputMaybe<WebuserSortInput>;
  take?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<WebuserFilterInput>;
};

export type RootQueryTypeOneBlogpostArgs = {
  where: BlogpostFilterInput;
};

export type RootQueryTypeOneCarouselImageArgs = {
  where: CarouselImageFilterInput;
};

export type RootQueryTypeOneColorArgs = {
  where: ColorFilterInput;
};

export type RootQueryTypeOneCountriesArgs = {
  where: CountriesFilterInput;
};

export type RootQueryTypeOneDocumentArgs = {
  where: DocumentFilterInput;
};

export type RootQueryTypeOneFileArgs = {
  where: _FileFilterInput;
};

export type RootQueryTypeOneReleaseArgs = {
  where: ReleaseFilterInput;
};

export type RootQueryTypeOneRoleArgs = {
  where: RoleFilterInput;
};

export type RootQueryTypeOneShopItemArgs = {
  where: ShopItemFilterInput;
};

export type RootQueryTypeOneShoppingCartArgs = {
  where: ShoppingCartFilterInput;
};

export type RootQueryTypeOneTestOneArgs = {
  where: TestOneFilterInput;
};

export type RootQueryTypeOneTestTwoArgs = {
  where: TestTwoFilterInput;
};

export type RootQueryTypeOneUserArgs = {
  where: UserFilterInput;
};

export type RootQueryTypeOneWebuserArgs = {
  where: WebuserFilterInput;
};

export type ShopItem = {
  __typename?: "ShopItem";
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  id?: Maybe<Scalars["Int"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  /** @deprecated Querying directly on a Image property is deprecated. Use the child fields 'url', 'name' and 'resized' instead. */
  photos?: Maybe<Array<Maybe<Image>>>;
  price?: Maybe<Scalars["Decimal"]["output"]>;
  shoppingcart?: Maybe<ShoppingCart>;
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
};

export enum ShopItemFieldsEnum {
  CreatedAt = "createdAt",
  Description = "description",
  Id = "id",
  Name = "name",
  Photos = "photos",
  Price = "price",
  UpdatedAt = "updatedAt",
}

export type ShopItemFilterInput = {
  _and?: InputMaybe<Array<InputMaybe<ShopItemFilterInput>>>;
  _or?: InputMaybe<Array<InputMaybe<ShopItemFilterInput>>>;
  createdAt?: InputMaybe<DateTimeOperator>;
  description?: InputMaybe<StringOperator>;
  id?: InputMaybe<IntOperator>;
  name?: InputMaybe<StringOperator>;
  photos?: InputMaybe<Array<InputMaybe<ImageOperator>>>;
  price?: InputMaybe<DecimalOperator>;
  shoppingcart?: InputMaybe<ShoppingCartFilterInput>;
  updatedAt?: InputMaybe<DateTimeOperator>;
};

export type ShopItemList = {
  __typename?: "ShopItemList";
  results?: Maybe<Array<Maybe<ShopItem>>>;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

export type ShopItemRelationInput = {
  id?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ShopItemRelationMethodInput = {
  _add?: InputMaybe<Array<InputMaybe<ShopItemRelationInput>>>;
  _remove?: InputMaybe<Array<InputMaybe<ShopItemRelationInput>>>;
  _replace?: InputMaybe<Array<InputMaybe<ShopItemRelationInput>>>;
};

export type ShopItemRelationSortInput = {
  createdAt?: InputMaybe<SortOrder>;
  description?: InputMaybe<SortOrder>;
  id?: InputMaybe<SortOrder>;
  name?: InputMaybe<SortOrder>;
  price?: InputMaybe<SortOrder>;
  shoppingcart?: InputMaybe<ShoppingCartRelationSortInput>;
  updatedAt?: InputMaybe<SortOrder>;
};

export enum ShopItemRelationalFieldsEnum {
  Shoppingcart = "shoppingcart",
}

export type ShopItemSortInput = {
  field?: InputMaybe<ShopItemFieldsEnum>;
  order?: InputMaybe<SortOrder>;
  relation?: InputMaybe<ShopItemRelationSortInput>;
};

export type ShoppingCart = {
  __typename?: "ShoppingCart";
  amountOfItems?: Maybe<Scalars["Int"]["output"]>;
  cartType?: Maybe<CartTypeProperty1943605>;
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  id?: Maybe<Scalars["Int"]["output"]>;
  shopItems?: Maybe<Array<Maybe<ShopItem>>>;
  totalPrice?: Maybe<Scalars["Decimal"]["output"]>;
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
  webuser?: Maybe<Webuser>;
};

export type ShoppingCartShopItemsArgs = {
  sort?: InputMaybe<ShopItemSortInput>;
  where?: InputMaybe<ShopItemFilterInput>;
};

export enum ShoppingCartFieldsEnum {
  AmountOfItems = "amountOfItems",
  CartType = "cartType",
  CreatedAt = "createdAt",
  Id = "id",
  TotalPrice = "totalPrice",
  UpdatedAt = "updatedAt",
}

export type ShoppingCartFilterInput = {
  _and?: InputMaybe<Array<InputMaybe<ShoppingCartFilterInput>>>;
  _or?: InputMaybe<Array<InputMaybe<ShoppingCartFilterInput>>>;
  amountOfItems?: InputMaybe<IntOperator>;
  cartType?: InputMaybe<EnumOperator>;
  createdAt?: InputMaybe<DateTimeOperator>;
  id?: InputMaybe<IntOperator>;
  shopItems?: InputMaybe<Array<InputMaybe<ShopItemFilterInput>>>;
  totalPrice?: InputMaybe<DecimalOperator>;
  updatedAt?: InputMaybe<DateTimeOperator>;
  webuser?: InputMaybe<WebuserFilterInput>;
};

export type ShoppingCartList = {
  __typename?: "ShoppingCartList";
  results?: Maybe<Array<Maybe<ShoppingCart>>>;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

export type ShoppingCartRelationInput = {
  id?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ShoppingCartRelationMethodInput = {
  _add?: InputMaybe<Array<InputMaybe<ShoppingCartRelationInput>>>;
  _remove?: InputMaybe<Array<InputMaybe<ShoppingCartRelationInput>>>;
  _replace?: InputMaybe<Array<InputMaybe<ShoppingCartRelationInput>>>;
};

export type ShoppingCartRelationSortInput = {
  amountOfItems?: InputMaybe<SortOrder>;
  cartType?: InputMaybe<SortOrder>;
  createdAt?: InputMaybe<SortOrder>;
  id?: InputMaybe<SortOrder>;
  totalPrice?: InputMaybe<SortOrder>;
  updatedAt?: InputMaybe<SortOrder>;
  webuser?: InputMaybe<WebuserRelationSortInput>;
};

export enum ShoppingCartRelationalFieldsEnum {
  Webuser = "webuser",
}

export type ShoppingCartSortInput = {
  field?: InputMaybe<ShoppingCartFieldsEnum>;
  order?: InputMaybe<SortOrder>;
  relation?: InputMaybe<ShoppingCartRelationSortInput>;
};

export type Size = {
  __typename?: "Size";
  height: Scalars["Int"]["output"];
  width: Scalars["Int"]["output"];
};

export enum SortOrder {
  Asc = "ASC",
  Desc = "DESC",
}

export enum StatusProperty10707188 {
  Draft = "Draft",
  Live = "Live",
}

export type StringOperator = {
  doesNotMatch?: InputMaybe<Scalars["String"]["input"]>;
  endsWith?: InputMaybe<Scalars["String"]["input"]>;
  eq?: InputMaybe<Scalars["String"]["input"]>;
  in?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
  matches?: InputMaybe<Scalars["String"]["input"]>;
  neq?: InputMaybe<Scalars["String"]["input"]>;
  nin?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
  regex?: InputMaybe<Scalars["String"]["input"]>;
  startsWith?: InputMaybe<Scalars["String"]["input"]>;
};

export type TestOne = {
  __typename?: "TestOne";
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  ditIsEenNummer?: Maybe<Scalars["String"]["output"]>;
  ditIsEenText?: Maybe<Scalars["String"]["output"]>;
  id?: Maybe<Scalars["Int"]["output"]>;
  testtwos?: Maybe<Array<Maybe<TestTwo>>>;
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
};

export type TestOneTesttwosArgs = {
  sort?: InputMaybe<TestTwoSortInput>;
  where?: InputMaybe<TestTwoFilterInput>;
};

export enum TestOneFieldsEnum {
  CreatedAt = "createdAt",
  DitIsEenNummer = "ditIsEenNummer",
  DitIsEenText = "ditIsEenText",
  Id = "id",
  UpdatedAt = "updatedAt",
}

export type TestOneFilterInput = {
  _and?: InputMaybe<Array<InputMaybe<TestOneFilterInput>>>;
  _or?: InputMaybe<Array<InputMaybe<TestOneFilterInput>>>;
  createdAt?: InputMaybe<DateTimeOperator>;
  ditIsEenNummer?: InputMaybe<StringOperator>;
  ditIsEenText?: InputMaybe<StringOperator>;
  id?: InputMaybe<IntOperator>;
  testtwos?: InputMaybe<Array<InputMaybe<TestTwoFilterInput>>>;
  updatedAt?: InputMaybe<DateTimeOperator>;
};

export type TestOneList = {
  __typename?: "TestOneList";
  results?: Maybe<Array<Maybe<TestOne>>>;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

export type TestOneRelationInput = {
  id?: InputMaybe<Scalars["Int"]["input"]>;
};

export type TestOneRelationMethodInput = {
  _add?: InputMaybe<Array<InputMaybe<TestOneRelationInput>>>;
  _remove?: InputMaybe<Array<InputMaybe<TestOneRelationInput>>>;
  _replace?: InputMaybe<Array<InputMaybe<TestOneRelationInput>>>;
};

export type TestOneRelationSortInput = {
  createdAt?: InputMaybe<SortOrder>;
  ditIsEenNummer?: InputMaybe<SortOrder>;
  ditIsEenText?: InputMaybe<SortOrder>;
  id?: InputMaybe<SortOrder>;
  updatedAt?: InputMaybe<SortOrder>;
};

export enum TestOneRelationalFieldsEnum {
  Undefined = "undefined",
}

export type TestOneSortInput = {
  field?: InputMaybe<TestOneFieldsEnum>;
  order?: InputMaybe<SortOrder>;
  relation?: InputMaybe<TestOneRelationSortInput>;
};

export type TestTwo = {
  __typename?: "TestTwo";
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  id?: Maybe<Scalars["Int"]["output"]>;
  testOnes?: Maybe<Array<Maybe<TestOne>>>;
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
};

export type TestTwoTestOnesArgs = {
  sort?: InputMaybe<TestOneSortInput>;
  where?: InputMaybe<TestOneFilterInput>;
};

export enum TestTwoFieldsEnum {
  CreatedAt = "createdAt",
  Id = "id",
  UpdatedAt = "updatedAt",
}

export type TestTwoFilterInput = {
  _and?: InputMaybe<Array<InputMaybe<TestTwoFilterInput>>>;
  _or?: InputMaybe<Array<InputMaybe<TestTwoFilterInput>>>;
  createdAt?: InputMaybe<DateTimeOperator>;
  id?: InputMaybe<IntOperator>;
  testOnes?: InputMaybe<Array<InputMaybe<TestOneFilterInput>>>;
  updatedAt?: InputMaybe<DateTimeOperator>;
};

export type TestTwoList = {
  __typename?: "TestTwoList";
  results?: Maybe<Array<Maybe<TestTwo>>>;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

export type TestTwoRelationInput = {
  id?: InputMaybe<Scalars["Int"]["input"]>;
};

export type TestTwoRelationMethodInput = {
  _add?: InputMaybe<Array<InputMaybe<TestTwoRelationInput>>>;
  _remove?: InputMaybe<Array<InputMaybe<TestTwoRelationInput>>>;
  _replace?: InputMaybe<Array<InputMaybe<TestTwoRelationInput>>>;
};

export type TestTwoRelationSortInput = {
  createdAt?: InputMaybe<SortOrder>;
  id?: InputMaybe<SortOrder>;
  updatedAt?: InputMaybe<SortOrder>;
};

export enum TestTwoRelationalFieldsEnum {
  Undefined = "undefined",
}

export type TestTwoSortInput = {
  field?: InputMaybe<TestTwoFieldsEnum>;
  order?: InputMaybe<SortOrder>;
  relation?: InputMaybe<TestTwoRelationSortInput>;
};

export type UpdateManyResult = {
  __typename?: "UpdateManyResult";
  id?: Maybe<Array<Maybe<Scalars["Int"]["output"]>>>;
};

export type UpdateResult = {
  __typename?: "UpdateResult";
  id?: Maybe<Scalars["Int"]["output"]>;
};

export type UpsertManyResult = {
  __typename?: "UpsertManyResult";
  id?: Maybe<Array<Maybe<Scalars["Int"]["output"]>>>;
};

export type UpsertResult = {
  __typename?: "UpsertResult";
  id?: Maybe<Scalars["Int"]["output"]>;
};

export type User = {
  __typename?: "User";
  active?: Maybe<Scalars["Boolean"]["output"]>;
  apiPassword?: Maybe<Scalars["String"]["output"]>;
  casToken?: Maybe<Scalars["String"]["output"]>;
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  developer?: Maybe<Scalars["Boolean"]["output"]>;
  email?: Maybe<Scalars["String"]["output"]>;
  id?: Maybe<Scalars["Int"]["output"]>;
  locale?: Maybe<LocaleProperty7641993>;
  name?: Maybe<Scalars["String"]["output"]>;
  readMetadata?: Maybe<Scalars["Boolean"]["output"]>;
  receivesNotifications?: Maybe<Scalars["Boolean"]["output"]>;
  roles?: Maybe<Array<Maybe<Role>>>;
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
};

export type UserRolesArgs = {
  sort?: InputMaybe<RoleSortInput>;
  where?: InputMaybe<RoleFilterInput>;
};

export enum UserFieldsEnum {
  Active = "active",
  ApiPassword = "apiPassword",
  CasToken = "casToken",
  CreatedAt = "createdAt",
  Developer = "developer",
  Email = "email",
  Id = "id",
  Locale = "locale",
  Name = "name",
  ReadMetadata = "readMetadata",
  ReceivesNotifications = "receivesNotifications",
  UpdatedAt = "updatedAt",
}

export type UserFilterInput = {
  _and?: InputMaybe<Array<InputMaybe<UserFilterInput>>>;
  _or?: InputMaybe<Array<InputMaybe<UserFilterInput>>>;
  active?: InputMaybe<BooleanOperator>;
  apiPassword?: InputMaybe<StringOperator>;
  casToken?: InputMaybe<StringOperator>;
  createdAt?: InputMaybe<DateTimeOperator>;
  developer?: InputMaybe<BooleanOperator>;
  email?: InputMaybe<StringOperator>;
  id?: InputMaybe<IntOperator>;
  locale?: InputMaybe<EnumOperator>;
  name?: InputMaybe<StringOperator>;
  readMetadata?: InputMaybe<BooleanOperator>;
  receivesNotifications?: InputMaybe<BooleanOperator>;
  roles?: InputMaybe<Array<InputMaybe<RoleFilterInput>>>;
  updatedAt?: InputMaybe<DateTimeOperator>;
};

export type UserList = {
  __typename?: "UserList";
  results?: Maybe<Array<Maybe<User>>>;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

export type UserRelationInput = {
  id?: InputMaybe<Scalars["Int"]["input"]>;
};

export type UserRelationMethodInput = {
  _add?: InputMaybe<Array<InputMaybe<UserRelationInput>>>;
  _remove?: InputMaybe<Array<InputMaybe<UserRelationInput>>>;
  _replace?: InputMaybe<Array<InputMaybe<UserRelationInput>>>;
};

export type UserRelationSortInput = {
  active?: InputMaybe<SortOrder>;
  apiPassword?: InputMaybe<SortOrder>;
  casToken?: InputMaybe<SortOrder>;
  createdAt?: InputMaybe<SortOrder>;
  developer?: InputMaybe<SortOrder>;
  email?: InputMaybe<SortOrder>;
  id?: InputMaybe<SortOrder>;
  locale?: InputMaybe<SortOrder>;
  name?: InputMaybe<SortOrder>;
  readMetadata?: InputMaybe<SortOrder>;
  receivesNotifications?: InputMaybe<SortOrder>;
  updatedAt?: InputMaybe<SortOrder>;
};

export enum UserRelationalFieldsEnum {
  Undefined = "undefined",
}

export type UserSortInput = {
  field?: InputMaybe<UserFieldsEnum>;
  order?: InputMaybe<SortOrder>;
  relation?: InputMaybe<UserRelationSortInput>;
};

export type Webuser = {
  __typename?: "Webuser";
  active?: Maybe<Scalars["Boolean"]["output"]>;
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  emailAddress?: Maybe<Scalars["String"]["output"]>;
  firstName?: Maybe<Scalars["String"]["output"]>;
  fullName?: Maybe<Scalars["String"]["output"]>;
  id?: Maybe<Scalars["Int"]["output"]>;
  lastName?: Maybe<Scalars["String"]["output"]>;
  password?: Maybe<Scalars["String"]["output"]>;
  /** @deprecated Querying directly on a Image property is deprecated. Use the child fields 'url', 'name' and 'resized' instead. */
  profileImage?: Maybe<Image>;
  profileImageUrl?: Maybe<Scalars["String"]["output"]>;
  roles?: Maybe<Array<Maybe<Role>>>;
  shoppingcarts?: Maybe<Array<Maybe<ShoppingCart>>>;
  token?: Maybe<Scalars["String"]["output"]>;
  tokenExpiration?: Maybe<Scalars["DateTime"]["output"]>;
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
};

export type WebuserRolesArgs = {
  sort?: InputMaybe<RoleSortInput>;
  where?: InputMaybe<RoleFilterInput>;
};

export type WebuserShoppingcartsArgs = {
  sort?: InputMaybe<ShoppingCartSortInput>;
  where?: InputMaybe<ShoppingCartFilterInput>;
};

export enum WebuserFieldsEnum {
  Active = "active",
  CreatedAt = "createdAt",
  EmailAddress = "emailAddress",
  FirstName = "firstName",
  FullName = "fullName",
  Id = "id",
  LastName = "lastName",
  Password = "password",
  ProfileImage = "profileImage",
  ProfileImageUrl = "profileImageUrl",
  Token = "token",
  TokenExpiration = "tokenExpiration",
  UpdatedAt = "updatedAt",
}

export type WebuserFilterInput = {
  _and?: InputMaybe<Array<InputMaybe<WebuserFilterInput>>>;
  _or?: InputMaybe<Array<InputMaybe<WebuserFilterInput>>>;
  active?: InputMaybe<BooleanOperator>;
  createdAt?: InputMaybe<DateTimeOperator>;
  emailAddress?: InputMaybe<StringOperator>;
  firstName?: InputMaybe<StringOperator>;
  fullName?: InputMaybe<StringOperator>;
  id?: InputMaybe<IntOperator>;
  lastName?: InputMaybe<StringOperator>;
  password?: InputMaybe<StringOperator>;
  profileImage?: InputMaybe<ImageOperator>;
  profileImageUrl?: InputMaybe<StringOperator>;
  roles?: InputMaybe<Array<InputMaybe<RoleFilterInput>>>;
  shoppingcarts?: InputMaybe<Array<InputMaybe<ShoppingCartFilterInput>>>;
  token?: InputMaybe<StringOperator>;
  tokenExpiration?: InputMaybe<DateTimeOperator>;
  updatedAt?: InputMaybe<DateTimeOperator>;
};

export type WebuserList = {
  __typename?: "WebuserList";
  results?: Maybe<Array<Maybe<Webuser>>>;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

export type WebuserRelationInput = {
  id?: InputMaybe<Scalars["Int"]["input"]>;
};

export type WebuserRelationMethodInput = {
  _add?: InputMaybe<Array<InputMaybe<WebuserRelationInput>>>;
  _remove?: InputMaybe<Array<InputMaybe<WebuserRelationInput>>>;
  _replace?: InputMaybe<Array<InputMaybe<WebuserRelationInput>>>;
};

export type WebuserRelationSortInput = {
  active?: InputMaybe<SortOrder>;
  createdAt?: InputMaybe<SortOrder>;
  emailAddress?: InputMaybe<SortOrder>;
  firstName?: InputMaybe<SortOrder>;
  fullName?: InputMaybe<SortOrder>;
  id?: InputMaybe<SortOrder>;
  lastName?: InputMaybe<SortOrder>;
  password?: InputMaybe<SortOrder>;
  profileImage?: InputMaybe<SortOrder>;
  profileImageUrl?: InputMaybe<SortOrder>;
  token?: InputMaybe<SortOrder>;
  tokenExpiration?: InputMaybe<SortOrder>;
  updatedAt?: InputMaybe<SortOrder>;
};

export enum WebuserRelationalFieldsEnum {
  Undefined = "undefined",
}

export type WebuserSortInput = {
  field?: InputMaybe<WebuserFieldsEnum>;
  order?: InputMaybe<SortOrder>;
  relation?: InputMaybe<WebuserRelationSortInput>;
};

export type _File = {
  __typename?: "_File";
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  /** @deprecated Querying directly on a File property is deprecated. Use the child fields 'url' and 'name' instead. */
  file?: Maybe<File>;
  id?: Maybe<Scalars["Int"]["output"]>;
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
};

export enum _FileFieldsEnum {
  CreatedAt = "createdAt",
  File = "file",
  Id = "id",
  UpdatedAt = "updatedAt",
}

export type _FileFilterInput = {
  _and?: InputMaybe<Array<InputMaybe<_FileFilterInput>>>;
  _or?: InputMaybe<Array<InputMaybe<_FileFilterInput>>>;
  createdAt?: InputMaybe<DateTimeOperator>;
  file?: InputMaybe<FileOperator>;
  id?: InputMaybe<IntOperator>;
  updatedAt?: InputMaybe<DateTimeOperator>;
};

export type _FileList = {
  __typename?: "_FileList";
  results?: Maybe<Array<Maybe<_File>>>;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

export type _FileRelationSortInput = {
  createdAt?: InputMaybe<SortOrder>;
  file?: InputMaybe<SortOrder>;
  id?: InputMaybe<SortOrder>;
  updatedAt?: InputMaybe<SortOrder>;
};

export enum _FileRelationalFieldsEnum {
  Undefined = "undefined",
}

export type _FileSortInput = {
  field?: InputMaybe<_FileFieldsEnum>;
  order?: InputMaybe<SortOrder>;
  relation?: InputMaybe<_FileRelationSortInput>;
};
