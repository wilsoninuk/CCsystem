--
-- PostgreSQL database dump
--

-- Dumped from database version 15.12
-- Dumped by pg_dump version 15.12

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO neondb_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: neondb_owner
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Account; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Account" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text
);


ALTER TABLE public."Account" OWNER TO neondb_owner;

--
-- Name: CommercialInvoice; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."CommercialInvoice" (
    id text NOT NULL,
    number text NOT NULL,
    "customerId" text NOT NULL,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    "shippingDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    remark text
);


ALTER TABLE public."CommercialInvoice" OWNER TO neondb_owner;

--
-- Name: CommercialInvoiceItem; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."CommercialInvoiceItem" (
    id text NOT NULL,
    "ciId" text NOT NULL,
    "productId" text NOT NULL,
    quantity integer NOT NULL,
    "priceRMB" double precision NOT NULL,
    "priceUSD" double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CommercialInvoiceItem" OWNER TO neondb_owner;

--
-- Name: Customer; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Customer" (
    id text NOT NULL,
    name text NOT NULL,
    "piAddress" text NOT NULL,
    "shippingMethod" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    code text NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    "exchangeRate" double precision,
    "isActive" boolean DEFAULT true NOT NULL,
    "paymentMethod" text NOT NULL,
    "piShipper" text NOT NULL,
    remark text
);


ALTER TABLE public."Customer" OWNER TO neondb_owner;

--
-- Name: CustomerProductHistory; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."CustomerProductHistory" (
    id text NOT NULL,
    "customerId" text NOT NULL,
    "productId" text NOT NULL,
    "priceRMB" double precision NOT NULL,
    "priceUSD" double precision NOT NULL,
    quantity integer NOT NULL,
    "shippedAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CustomerProductHistory" OWNER TO neondb_owner;

--
-- Name: CustomerProductPrice; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."CustomerProductPrice" (
    id text NOT NULL,
    "customerId" text NOT NULL,
    price double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    "productId" text NOT NULL,
    remark text
);


ALTER TABLE public."CustomerProductPrice" OWNER TO neondb_owner;

--
-- Name: Product; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Product" (
    id text NOT NULL,
    barcode text NOT NULL,
    "itemNo" text NOT NULL,
    description text NOT NULL,
    cost double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "cartonSize" text,
    "cartonWeight" double precision,
    color text,
    "isActive" boolean DEFAULT true NOT NULL,
    link1688 text,
    material text,
    moq integer,
    "productSize" text,
    supplier text,
    category text,
    "createdBy" text,
    "updatedBy" text,
    "additionalPictures" text[],
    picture text
);


ALTER TABLE public."Product" OWNER TO neondb_owner;

--
-- Name: ProductImage; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."ProductImage" (
    id text NOT NULL,
    url text NOT NULL,
    "isMain" boolean DEFAULT false NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "productId" text NOT NULL
);


ALTER TABLE public."ProductImage" OWNER TO neondb_owner;

--
-- Name: ProductQuote; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."ProductQuote" (
    id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "productId" text NOT NULL,
    "customerId" text NOT NULL,
    price double precision NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "validUntil" timestamp(3) without time zone,
    remark text
);


ALTER TABLE public."ProductQuote" OWNER TO neondb_owner;

--
-- Name: Quotation; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Quotation" (
    id text NOT NULL,
    "customerId" text NOT NULL,
    status text NOT NULL,
    "exchangeRate" double precision NOT NULL,
    "totalAmountRMB" double precision DEFAULT 0 NOT NULL,
    "totalAmountUSD" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    number text NOT NULL,
    remark text,
    "userId" text NOT NULL,
    "customerName" text NOT NULL,
    "paymentMethod" text NOT NULL,
    "piAddress" text NOT NULL,
    "piShipper" text NOT NULL,
    "shippingMethod" text NOT NULL,
    "shippingDate" timestamp(3) without time zone
);


ALTER TABLE public."Quotation" OWNER TO neondb_owner;

--
-- Name: QuotationItem; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."QuotationItem" (
    id text NOT NULL,
    "quotationId" text NOT NULL,
    barcode text NOT NULL,
    "serialNo" integer NOT NULL,
    quantity integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "actualQty" integer,
    "exwPriceRMB" double precision NOT NULL,
    "exwPriceUSD" double precision NOT NULL,
    "finalPriceRMB" double precision,
    "finalPriceUSD" double precision,
    profit double precision,
    "profitRate" double precision,
    remark text,
    shipping double precision,
    "productId" text NOT NULL,
    color text,
    "productDeleted" boolean DEFAULT false NOT NULL,
    "productSnapshot" jsonb
);


ALTER TABLE public."QuotationItem" OWNER TO neondb_owner;

--
-- Name: QuotationRevision; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."QuotationRevision" (
    id text NOT NULL,
    "quotationId" text NOT NULL,
    version integer NOT NULL,
    changes jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."QuotationRevision" OWNER TO neondb_owner;

--
-- Name: Session; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Session" OWNER TO neondb_owner;

--
-- Name: User; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    password text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "emailVerified" timestamp(3) without time zone,
    image text,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."User" OWNER TO neondb_owner;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO neondb_owner;

--
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Account" (id, "userId", type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state) FROM stdin;
\.


--
-- Data for Name: CommercialInvoice; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."CommercialInvoice" (id, number, "customerId", status, "shippingDate", "createdAt", "updatedAt", remark) FROM stdin;
\.


--
-- Data for Name: CommercialInvoiceItem; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."CommercialInvoiceItem" (id, "ciId", "productId", quantity, "priceRMB", "priceUSD", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Customer; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Customer" (id, name, "piAddress", "shippingMethod", "createdAt", "updatedAt", code, currency, "exchangeRate", "isActive", "paymentMethod", "piShipper", remark) FROM stdin;
cm84ccc9c0000vj5gqhc2rbre	Tshering	Thimphu001	FOB	2025-03-11 10:21:04.605	2025-03-11 10:21:04.605	BT001	USD	7.2	t	T/T	CC BRAND Management	
\.


--
-- Data for Name: CustomerProductHistory; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."CustomerProductHistory" (id, "customerId", "productId", "priceRMB", "priceUSD", quantity, "shippedAt", "createdAt", "updatedAt") FROM stdin;
cm85pcmbq0001jr03wy5au6dr	cm84ccc9c0000vj5gqhc2rbre	cm845v6lc0014vju0lpstkc2t	100	13.88888888888889	1	2025-03-12 08:00:00	2025-03-12 09:12:58.884	2025-03-12 09:12:58.884
cm85pcmbq0002jr03fcgpc0ve	cm84ccc9c0000vj5gqhc2rbre	cm845v6pz0016vju0z8ys32zm	101	14.02777777777778	1	2025-03-12 08:00:00	2025-03-12 09:12:58.884	2025-03-12 09:12:58.884
cm85pcmbq0003jr03yte02f3s	cm84ccc9c0000vj5gqhc2rbre	cm845v6pz0016vju0z8ys32zm	120	16.67	6	2025-03-12 08:00:00	2025-03-12 09:12:58.884	2025-03-12 09:12:58.884
cm85pcmbq0004jr03ypyvvcn9	cm84ccc9c0000vj5gqhc2rbre	cm845v6lc0014vju0lpstkc2t	110	15.28	8	2025-03-12 08:00:00	2025-03-12 09:12:58.884	2025-03-12 09:12:58.884
\.


--
-- Data for Name: CustomerProductPrice; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."CustomerProductPrice" (id, "customerId", price, "createdAt", "updatedAt", currency, "productId", remark) FROM stdin;
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Product" (id, barcode, "itemNo", description, cost, "createdAt", "updatedAt", "cartonSize", "cartonWeight", color, "isActive", link1688, material, moq, "productSize", supplier, category, "createdBy", "updatedBy", "additionalPictures", picture) FROM stdin;
cm85mji5f0001la03tn5wovkf	6999999999999	ABC99	示例商品描述	999	2025-03-12 07:54:21.219	2025-03-12 09:10:48.153	100x200x300cm	5.5	红色	t	https://detail.1688.com/xxx	塑料	1000	10x20x30cm	示例供应商	示例类别	cm844xha70000vjfgd2eb90t3	cm85mmhvq0006la03mpb55spb	\N	\N
cm845v6pz0016vju0z8ys32zm	6991234567893	ABC1241	示例商品描述	101	2025-03-11 07:19:46.631	2025-03-12 09:10:48.841	100x200x301cm	6.5	红色	t	https://detail.1688.com/offer/823223556013.html?spm=a261y.7663282.3002526303362814.17.46e65be8AOeCXa	塑料	1001	10x20x31cm	示例供应商	示例类别	cm844xha70000vjfgd2eb90t3	cm85mmhvq0006la03mpb55spb	\N	https://res.cloudinary.com/duiecmcry/image/upload/v1/products/6991234567893.jpg
cm845v6lc0014vju0lpstkc2t	6991234567892	ABC9999	示例商品描述	100	2025-03-11 07:19:46.462	2025-03-12 09:10:49.453	100x200x300cm	5.5	红色	t	https://detail.1688.com/offer/867159480543.html?sk=consign&__tdScene__=jxhy-od&&spm=a21vf6.result.0.i16	塑料	1000	10x20x30cm	示例供应商	示例类别	cm844xha70000vjfgd2eb90t3	cm85mnm280000la03yl1cat5c	\N	https://res.cloudinary.com/duiecmcry/image/upload/v1/products/6991234567892.jpg
cm85fr6y00007vjwk1g1tjehb	6901234567890	ABC123	示例商品描述	100	2025-03-12 04:44:22.632	2025-03-13 04:33:49.451	100x200x300cm	5.5	红色	t	https://detail.1688.com/offer/782204460027.html?spm=a26352.13672862.offerlist.103.30e41e62V1VGVu&cosite=-&tracelog=p4p&_p_isad=1&clickid=8fde25e651b74c63a7fc5dc9a2badc91&sessionid=b83ffc1692d634b7b1108b0dbcfa6ade	塑料	1000	10x20x30cm	示例供应商	示例类别	cm844xha70000vjfgd2eb90t3	cm844xha70000vjfgd2eb90t3	\N	\N
\.


--
-- Data for Name: ProductImage; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ProductImage" (id, url, "isMain", "order", "createdAt", "updatedAt", "productId") FROM stdin;
cm85d0n6d0007vjos4wcgqxs5	/uploads/d30eacf2-eaef-426d-b973-da107f3b09b2.jpeg	t	0	2025-03-12 03:27:44.726	2025-03-12 03:27:44.726	cm845v6pz0016vju0z8ys32zm
\.


--
-- Data for Name: ProductQuote; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ProductQuote" (id, "createdAt", "updatedAt", "productId", "customerId", price, currency, status, "validUntil", remark) FROM stdin;
\.


--
-- Data for Name: Quotation; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Quotation" (id, "customerId", status, "exchangeRate", "totalAmountRMB", "totalAmountUSD", "createdAt", "updatedAt", number, remark, "userId", "customerName", "paymentMethod", "piAddress", "piShipper", "shippingMethod", "shippingDate") FROM stdin;
cm85a4fs50000vjcgfx1t4net	cm84ccc9c0000vj5gqhc2rbre	ci	7.2	1600	222.26	2025-03-12 02:06:42.917	2025-03-12 02:06:53.122	QT2503120001	\N	cm844xha70000vjfgd2eb90t3	Tshering	T/T	Thimphu001	CC BRAND Management	FOB	\N
cm85p6ft70000i8030lo8mxnp	cm84ccc9c0000vj5gqhc2rbre	draft	7.2	1099.08	152.65	2025-03-12 09:08:10.508	2025-03-12 09:09:57.629	QT2503120003	\N	cm85mnm280000la03yl1cat5c	Tshering	T/T	Thimphu001	CC BRAND Management	FOB	\N
cm85a58pr0007vjcgmdp4jdcy	cm84ccc9c0000vj5gqhc2rbre	ci	7.2	201	27.91666666666666	2025-03-12 02:07:20.415	2025-03-12 09:12:39.393	QT2503120002	\N	cm844xha70000vjfgd2eb90t3	Tshering	T/T	Thimphu001	CC BRAND Management	FOB	2025-03-12 16:00:00
\.


--
-- Data for Name: QuotationItem; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."QuotationItem" (id, "quotationId", barcode, "serialNo", quantity, "createdAt", "updatedAt", "actualQty", "exwPriceRMB", "exwPriceUSD", "finalPriceRMB", "finalPriceUSD", profit, "profitRate", remark, shipping, "productId", color, "productDeleted", "productSnapshot") FROM stdin;
cm85a4fs50002vjcgo44zk7wj	cm85a4fs50000vjcgfx1t4net	6991234567893	1	6	2025-03-12 02:06:42.917	2025-03-12 02:06:42.917	\N	120	16.67	\N	\N	\N	\N	1	\N	cm845v6pz0016vju0z8ys32zm	\N	f	\N
cm85a4fs50003vjcgdj7b0yw1	cm85a4fs50000vjcgfx1t4net	6991234567892	2	8	2025-03-12 02:06:42.917	2025-03-12 02:06:42.917	\N	110	15.28	\N	\N	\N	\N	\N	\N	cm845v6lc0014vju0lpstkc2t	\N	f	\N
cm85fgbhh0004vjwkua2mk0ne	cm85a58pr0007vjcgmdp4jdcy	6991234567892	1	1	2025-03-12 04:35:55.301	2025-03-12 04:35:55.301	\N	100	13.88888888888889	\N	\N	\N	\N	\N	\N	cm845v6lc0014vju0lpstkc2t	\N	f	\N
cm85fgbhh0005vjwkw25jum7a	cm85a58pr0007vjcgmdp4jdcy	6991234567893	2	1	2025-03-12 04:35:55.301	2025-03-12 04:35:55.301	\N	101	14.02777777777778	\N	\N	\N	\N	\N	\N	cm845v6pz0016vju0z8ys32zm	\N	f	\N
cm85p8qn30001jo03ofnhedhz	cm85p6ft70000i8030lo8mxnp	6991234567892	1	1	2025-03-12 09:09:57.629	2025-03-12 09:09:57.629	0	100.08	13.9	100.08	13.9	0	0	\N	9	cm845v6lc0014vju0lpstkc2t	\N	f	\N
cm85p8qn30002jo0359v9nx0n	cm85p6ft70000i8030lo8mxnp	6999999999999	2	1	2025-03-12 09:09:57.629	2025-03-12 09:09:57.629	0	999	138.75	999	138.75	0	0	\N	\N	cm85mji5f0001la03tn5wovkf	\N	f	\N
\.


--
-- Data for Name: QuotationRevision; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."QuotationRevision" (id, "quotationId", version, changes, "createdAt") FROM stdin;
cm85a4nnm0004vjcgh05vgzv5	cm85a4fs50000vjcgfx1t4net	1	{"status": {"to": "ci", "from": "draft"}}	2025-03-12 02:06:53.122
cm85pbyqp0000jr03litid8s0	cm85a58pr0007vjcgmdp4jdcy	1	{"status": {"to": "ci", "from": "draft"}}	2025-03-12 09:12:28.321
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Session" (id, "sessionToken", "userId", expires) FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."User" (id, email, name, password, "createdAt", "updatedAt", "emailVerified", image, "isActive") FROM stdin;
cm844xha70000vjfgd2eb90t3	wilsoninuk@gmail.com	Admin	$2b$10$l2QnA5Nh4Spfa0dIxifMQ.Hjj927utPIm2E9iyzsA1pHcH5FKvDr2	2025-03-11 06:53:34.013	2025-03-11 06:53:34.013	\N	\N	t
cm85mmhvq0006la03mpb55spb	jane@ccbrand.hk	Jane	$2b$10$Y2Z4IyP6ZCp42s5p1Vh1S.bEv1IlsvrRU8dk5omYPxdz3gKIN1b3y	2025-03-12 07:56:40.609	2025-03-12 07:56:40.609	\N	\N	t
cm85mnm280000la03yl1cat5c	elaine@ccbrand.hk	Elaine	$2b$10$bSYkNZEJepS3AIEagXAIS.Gg6HHTfhApgmxoyta1ihbuE0k7YuTwe	2025-03-12 07:57:32.688	2025-03-12 07:57:32.688	\N	\N	t
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
ef5131a2-f388-4776-a35e-6e2e23e338f4	6a48b0438cad2d7efa1cc6c6519fe5ee9bfc0d63eed4605b07e86710d3fde517	2025-03-11 06:53:15.032314+00	20250303115620_init	\N	\N	2025-03-11 06:53:14.707883+00	1
a96c6ba2-32bb-48a6-a089-92785980cd31	53f21f7d108a8a927110c211d5285df328726733654a5584b72883744512c506	2025-03-11 06:53:15.401631+00	20250303130741_add_product_images	\N	\N	2025-03-11 06:53:15.138031+00	1
1d5ee3f7-85c3-4186-a7f5-dfce539b4cee	c2d1de8bf867cec04735a1aff867cdb045c6193aee7c22a1aa884ebbce193ef4	2025-03-11 06:53:15.75514+00	20250303131815_add_product_images	\N	\N	2025-03-11 06:53:15.503645+00	1
8ac05bc2-1970-489c-91c7-f1fbcd16abcb	8703f2433b101554dfa8a2d6d93ca2d93ee1a1a9d84c9600a4caac78477391de	2025-03-11 06:53:16.139803+00	20250304110147_add_customer_product_history	\N	\N	2025-03-11 06:53:15.856911+00	1
d2083b35-b984-41f7-aeff-7c82976a2da5	7d6fa7b3066f030ccb1c4e876c2952901f6a1d44c9c6922864d7e3abd93ccb79	2025-03-11 06:53:16.491442+00	20250304113032_add_shipping_date_to_quotation	\N	\N	2025-03-11 06:53:16.240703+00	1
d52789c6-8c66-47be-ac23-03d1c549309a	9db9523d5ed9fd47f329b5b68526fe0c2cebecdb6392e36051040d6bc0d73872	2025-03-11 06:53:16.861232+00	20250305021545_add_commercial_invoice	\N	\N	2025-03-11 06:53:16.591833+00	1
8161f377-243d-4a43-8b36-c10b7a62acd5	a84d394b76fdc7ac6727f2416472ab1948cb8376da3d77bcb942ca4e02b2f4b9	2025-03-11 06:53:17.215211+00	20250307111036_add_soft_delete_to_products	\N	\N	2025-03-11 06:53:16.961073+00	1
4891a53e-9de8-4c95-bbe9-55e716a27ca7	24b02e55981056ec12ba46874f4ba44f603aa445c1c08429224226db03a7d724	2025-03-11 06:53:17.569087+00	20250308060106_add_user_active_status	\N	\N	2025-03-11 06:53:17.316181+00	1
ed2e3347-c0b8-4955-9276-8584a284e32c	b2cecc8abdf8bb176190aba1f27a24089af416985d9e69d914726d74ba41f5e3	2025-03-11 06:53:17.930057+00	20250310070745_add_is_deleted_to_product	\N	\N	2025-03-11 06:53:17.669426+00	1
ae9f2468-4e92-4f21-9155-4f7ac6557af1	879bf7638b0676b32e2b92db86de384beac0a7015202e46da7b1c160d02fa7df	2025-03-11 06:53:25.776957+00	20250311065325_add_product_deleted_fields	\N	\N	2025-03-11 06:53:25.51248+00	1
\.


--
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- Name: CommercialInvoiceItem CommercialInvoiceItem_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CommercialInvoiceItem"
    ADD CONSTRAINT "CommercialInvoiceItem_pkey" PRIMARY KEY (id);


--
-- Name: CommercialInvoice CommercialInvoice_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CommercialInvoice"
    ADD CONSTRAINT "CommercialInvoice_pkey" PRIMARY KEY (id);


--
-- Name: CustomerProductHistory CustomerProductHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CustomerProductHistory"
    ADD CONSTRAINT "CustomerProductHistory_pkey" PRIMARY KEY (id);


--
-- Name: CustomerProductPrice CustomerProductPrice_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CustomerProductPrice"
    ADD CONSTRAINT "CustomerProductPrice_pkey" PRIMARY KEY (id);


--
-- Name: Customer Customer_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "Customer_pkey" PRIMARY KEY (id);


--
-- Name: ProductImage ProductImage_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ProductImage"
    ADD CONSTRAINT "ProductImage_pkey" PRIMARY KEY (id);


--
-- Name: ProductQuote ProductQuote_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ProductQuote"
    ADD CONSTRAINT "ProductQuote_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: QuotationItem QuotationItem_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."QuotationItem"
    ADD CONSTRAINT "QuotationItem_pkey" PRIMARY KEY (id);


--
-- Name: QuotationRevision QuotationRevision_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."QuotationRevision"
    ADD CONSTRAINT "QuotationRevision_pkey" PRIMARY KEY (id);


--
-- Name: Quotation Quotation_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Quotation"
    ADD CONSTRAINT "Quotation_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Account_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON public."Account" USING btree (provider, "providerAccountId");


--
-- Name: Account_userId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Account_userId_idx" ON public."Account" USING btree ("userId");


--
-- Name: CommercialInvoiceItem_ciId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "CommercialInvoiceItem_ciId_idx" ON public."CommercialInvoiceItem" USING btree ("ciId");


--
-- Name: CommercialInvoiceItem_productId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "CommercialInvoiceItem_productId_idx" ON public."CommercialInvoiceItem" USING btree ("productId");


--
-- Name: CommercialInvoice_customerId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "CommercialInvoice_customerId_idx" ON public."CommercialInvoice" USING btree ("customerId");


--
-- Name: CommercialInvoice_number_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "CommercialInvoice_number_key" ON public."CommercialInvoice" USING btree (number);


--
-- Name: CommercialInvoice_shippingDate_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "CommercialInvoice_shippingDate_idx" ON public."CommercialInvoice" USING btree ("shippingDate");


--
-- Name: CommercialInvoice_status_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "CommercialInvoice_status_idx" ON public."CommercialInvoice" USING btree (status);


--
-- Name: CustomerProductHistory_customerId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "CustomerProductHistory_customerId_idx" ON public."CustomerProductHistory" USING btree ("customerId");


--
-- Name: CustomerProductHistory_productId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "CustomerProductHistory_productId_idx" ON public."CustomerProductHistory" USING btree ("productId");


--
-- Name: CustomerProductHistory_shippedAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "CustomerProductHistory_shippedAt_idx" ON public."CustomerProductHistory" USING btree ("shippedAt");


--
-- Name: CustomerProductPrice_customerId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "CustomerProductPrice_customerId_idx" ON public."CustomerProductPrice" USING btree ("customerId");


--
-- Name: CustomerProductPrice_customerId_productId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "CustomerProductPrice_customerId_productId_key" ON public."CustomerProductPrice" USING btree ("customerId", "productId");


--
-- Name: CustomerProductPrice_productId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "CustomerProductPrice_productId_idx" ON public."CustomerProductPrice" USING btree ("productId");


--
-- Name: Customer_code_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Customer_code_key" ON public."Customer" USING btree (code);


--
-- Name: ProductImage_isMain_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "ProductImage_isMain_idx" ON public."ProductImage" USING btree ("isMain");


--
-- Name: ProductImage_productId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "ProductImage_productId_idx" ON public."ProductImage" USING btree ("productId");


--
-- Name: ProductQuote_customerId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "ProductQuote_customerId_idx" ON public."ProductQuote" USING btree ("customerId");


--
-- Name: ProductQuote_productId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "ProductQuote_productId_idx" ON public."ProductQuote" USING btree ("productId");


--
-- Name: Product_barcode_unique; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Product_barcode_unique" ON public."Product" USING btree (barcode);


--
-- Name: Product_createdBy_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Product_createdBy_idx" ON public."Product" USING btree ("createdBy");


--
-- Name: Product_updatedBy_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Product_updatedBy_idx" ON public."Product" USING btree ("updatedBy");


--
-- Name: QuotationItem_productId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "QuotationItem_productId_idx" ON public."QuotationItem" USING btree ("productId");


--
-- Name: QuotationItem_quotationId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "QuotationItem_quotationId_idx" ON public."QuotationItem" USING btree ("quotationId");


--
-- Name: Quotation_number_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Quotation_number_idx" ON public."Quotation" USING btree (number);


--
-- Name: Quotation_number_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Quotation_number_key" ON public."Quotation" USING btree (number);


--
-- Name: Session_sessionToken_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Session_sessionToken_key" ON public."Session" USING btree ("sessionToken");


--
-- Name: Session_userId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Session_userId_idx" ON public."Session" USING btree ("userId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: Account Account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CommercialInvoiceItem CommercialInvoiceItem_ciId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CommercialInvoiceItem"
    ADD CONSTRAINT "CommercialInvoiceItem_ciId_fkey" FOREIGN KEY ("ciId") REFERENCES public."CommercialInvoice"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CommercialInvoiceItem CommercialInvoiceItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CommercialInvoiceItem"
    ADD CONSTRAINT "CommercialInvoiceItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CommercialInvoice CommercialInvoice_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CommercialInvoice"
    ADD CONSTRAINT "CommercialInvoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CustomerProductHistory CustomerProductHistory_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CustomerProductHistory"
    ADD CONSTRAINT "CustomerProductHistory_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CustomerProductHistory CustomerProductHistory_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CustomerProductHistory"
    ADD CONSTRAINT "CustomerProductHistory_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CustomerProductPrice CustomerProductPrice_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CustomerProductPrice"
    ADD CONSTRAINT "CustomerProductPrice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CustomerProductPrice CustomerProductPrice_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CustomerProductPrice"
    ADD CONSTRAINT "CustomerProductPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProductImage ProductImage_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ProductImage"
    ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductQuote ProductQuote_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ProductQuote"
    ADD CONSTRAINT "ProductQuote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProductQuote ProductQuote_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ProductQuote"
    ADD CONSTRAINT "ProductQuote_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Product Product_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Product Product_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: QuotationItem QuotationItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."QuotationItem"
    ADD CONSTRAINT "QuotationItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: QuotationItem QuotationItem_quotationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."QuotationItem"
    ADD CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES public."Quotation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: QuotationRevision QuotationRevision_quotationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."QuotationRevision"
    ADD CONSTRAINT "QuotationRevision_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES public."Quotation"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Quotation Quotation_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Quotation"
    ADD CONSTRAINT "Quotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Quotation Quotation_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Quotation"
    ADD CONSTRAINT "Quotation_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: neondb_owner
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

