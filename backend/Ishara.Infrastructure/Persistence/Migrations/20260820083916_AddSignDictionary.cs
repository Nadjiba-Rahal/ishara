using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ishara.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSignDictionary : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "sign_categories",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    slug = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sign_categories", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "signs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    arabic_label = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    gloss = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: true),
                    category_id = table.Column<Guid>(type: "uuid", nullable: true),
                    source_name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    source_record_id = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    ham_no_sys = table.Column<string>(type: "text", nullable: true),
                    sigml = table.Column<string>(type: "text", nullable: true),
                    media_url = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_signs", x => x.id);
                    table.ForeignKey(
                        name: "FK_signs_sign_categories_category_id",
                        column: x => x.category_id,
                        principalTable: "sign_categories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_sign_categories_slug",
                table: "sign_categories",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_signs_arabic_label",
                table: "signs",
                column: "arabic_label");

            migrationBuilder.CreateIndex(
                name: "IX_signs_category_id",
                table: "signs",
                column: "category_id");

            migrationBuilder.CreateIndex(
                name: "IX_signs_source_name_source_record_id",
                table: "signs",
                columns: new[] { "source_name", "source_record_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "signs");

            migrationBuilder.DropTable(
                name: "sign_categories");
        }
    }
}
