/*
  Warnings:

  - You are about to drop the column `additionalPictures` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `picture` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "additionalPictures",
DROP COLUMN "picture";
