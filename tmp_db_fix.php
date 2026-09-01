<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

$table = 'reservation_tables';
$db = config('database.connections.mysql.database');

echo "Checking table: $table\n";
$results = DB::select("SHOW CREATE TABLE $table");
$createStmt = (array) $results[0];
$sql = $createStmt['Create Table'];
echo "SQL: \n$sql\n\n";

// Find any foreign key referencing xreservations
if (preg_match('/CONSTRAINT `([^`]+)` FOREIGN KEY .* REFERENCES `xreservations`/', $sql, $matches)) {
    $fk = $matches[1];
    echo "Found corrupted FK: $fk\n";
    try {
        DB::statement("ALTER TABLE $table DROP FOREIGN KEY $fk");
        echo "Dropped $fk successfully.\n";
    } catch (\Exception $e) {
        echo "Failed to drop $fk: " . $e->getMessage() . "\n";
    }
} else {
    echo "No FK referencing xreservations found in SHOW CREATE TABLE.\n";
}

// Ensure the correct one exists
try {
    DB::statement("ALTER TABLE $table ADD CONSTRAINT `reservation_tables_reservation_id_foreign` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE CASCADE");
    echo "Added correct FK successfully.\n";
} catch (\Exception $e) {
    echo "Correct FK already exists or failed to add: " . $e->getMessage() . "\n";
}
